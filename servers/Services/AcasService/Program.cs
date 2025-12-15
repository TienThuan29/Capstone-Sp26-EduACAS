using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AcasService.Messaging;
using AcasService.Repositories.Redis;
using StackExchange.Redis;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// Redis configuration
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ??
                           throw new InvalidOperationException("Redis:ConnectionString is not configured");
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    return ConnectionMultiplexer.Connect(redisConnectionString);
});
builder.Services.AddHostedService<RedisHostedService>();

// RabbitMQ configuration - register as singleton first, then as hosted service
builder.Services.AddSingleton<RabbitMqHostedService>();
builder.Services.AddHostedService<RabbitMqHostedService>(sp => sp.GetRequiredService<RabbitMqHostedService>());

// RabbitMQ Producer
builder.Services.AddSingleton<UserRequestProducer>();

// JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:JwtSecret"] ??
                throw new InvalidOperationException("Jwt:JwtSecret is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AuthService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AcasService";

var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // Add event handlers for debugging
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(context.Exception, "JWT Authentication failed. Error: {Error}", context.Exception.Message);
            logger.LogInformation("Token: {Token}", context.Request.Headers["Authorization"].ToString());
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("JWT Token validated successfully. User: {User}, Roles: {Roles}", 
                context.Principal?.Identity?.Name,
                string.Join(", ", context.Principal?.Claims?.Where(c => c.Type == "role").Select(c => c.Value) ?? Array.Empty<string>()));
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT Challenge triggered. Error: {Error}, ErrorDescription: {ErrorDescription}", 
                context.Error, context.ErrorDescription);
            logger.LogInformation("Request Path: {Path}, Authorization Header: {AuthHeader}", 
                context.Request.Path, context.Request.Headers["Authorization"].ToString());
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "ACAS Service API",
        Version = "v1",
        Description = "ACAS Service API"
    });
});
// Health checks
var redisConnectionStringForHealth = builder.Configuration["Redis:ConnectionString"] ??
                                     throw new InvalidOperationException("Redis:ConnectionString is not configured");
var rabbitMqHostName = builder.Configuration["RabbitMQ:HostName"] ??
                       throw new InvalidOperationException("RabbitMQ:HostName is not configured");
var rabbitMqPort = builder.Configuration.GetValue<int>("RabbitMQ:Port", 5672);
var rabbitMqUserName = builder.Configuration["RabbitMQ:UserName"] ??
                       throw new InvalidOperationException("RabbitMQ:UserName is not configured");
var rabbitMqPassword = builder.Configuration["RabbitMQ:Password"] ??
                       throw new InvalidOperationException("RabbitMQ:Password is not configured");
var rabbitMqVirtualHost = builder.Configuration["RabbitMQ:VirtualHost"] ?? "/";

builder.Services.AddHealthChecks()
    .AddRedis(redisConnectionStringForHealth, name: "redis")
    .AddCheck<RabbitMqHealthCheck>("rabbitmq");

// Rate Limiting Configuration
var rateLimitingSection = builder.Configuration.GetSection("RateLimiting");
var globalPolicy = rateLimitingSection.GetSection("GlobalPolicy");
var apiPolicy = rateLimitingSection.GetSection("ApiPolicy");

builder.Services.AddRateLimiter(options =>
{
    // Global rate limiting policy
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = globalPolicy.GetValue<int>("PermitLimit", 100),
                Window = TimeSpan.Parse(globalPolicy.GetValue<string>("Window") ?? "00:01:00"),
                QueueLimit = globalPolicy.GetValue<int>("QueueLimit", 0)
            }));

    // Policy for API endpoints
    options.AddPolicy("ApiPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = apiPolicy.GetValue<int>("PermitLimit", 50),
                Window = TimeSpan.Parse(apiPolicy.GetValue<string>("Window") ?? "00:01:00"),
                QueueLimit = apiPolicy.GetValue<int>("QueueLimit", 0)
            }));

    // Rejection response
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync(
            "Rate limit exceeded. Please try again later.", cancellationToken: token);
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c =>
    {
        c.RouteTemplate = "swagger/{documentName}/swagger.json";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ACAS Service API");
        c.RoutePrefix = "swagger";
        c.ConfigObject.DisplayRequestDuration = true;
    });
}

app.MapGet("/openapi/v1.json", (HttpContext context) =>
{
    context.Response.Redirect("/swagger/v1/swagger.json", permanent: false);
});

app.UseHttpsRedirection();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
