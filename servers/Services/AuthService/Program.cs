using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using AuthService.Repositories.DynamoDB;
using System.Threading.RateLimiting;
using AuthService.Application.Commands;
using AuthService.Application.Mappers;
using AuthService.Application.Queries;
using AuthService.Application.Utils;
using AuthService.Repositories.User;
using AuthService.Repositories.Redis;
using AuthService.Messaging;
using StackExchange.Redis;
using RabbitMQ.Client;
using Microsoft.OpenApi;
using AuthService.Application.Notifications;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// config AWS DynamoDB
var awsRegion = builder.Configuration["AWS:Region"] ??
                throw new InvalidOperationException("AWS_REGION is not configured");
var awsAccessKey = builder.Configuration["AWS:AccessKey"] ??
                   throw new InvalidOperationException("AWS_ACCESS_KEY is not configured");
var awsSecretKey = builder.Configuration["AWS:SecretKey"] ??
                   throw new InvalidOperationException("AWS_SECRET_KEY is not configured");

var regionEndpoint = RegionEndpoint.GetBySystemName(awsRegion);

// Cấu hình DynamoDB client với retry policy mạnh hơn
var dynamoDbConfig = new Amazon.DynamoDBv2.AmazonDynamoDBConfig
{
    RegionEndpoint = regionEndpoint,
    RetryMode = Amazon.Runtime.RequestRetryMode.Adaptive,
    MaxErrorRetry = 10,
    Timeout = TimeSpan.FromSeconds(30),
};

var awsCredentials = !string.IsNullOrEmpty(awsAccessKey) && !string.IsNullOrEmpty(awsSecretKey)
    ? new Amazon.Runtime.BasicAWSCredentials(awsAccessKey, awsSecretKey)
    : null;

// Đăng ký DynamoDB client với Singleton lifetime để reuse connections
builder.Services.AddSingleton<IAmazonDynamoDB>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Initializing DynamoDB client with Adaptive retry mode, MaxErrorRetry=10");
    return new Amazon.DynamoDBv2.AmazonDynamoDBClient(awsCredentials, dynamoDbConfig);
});

// Redis configuration
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ??
                           throw new InvalidOperationException("Redis:ConnectionString is not configured");
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    return ConnectionMultiplexer.Connect(redisConnectionString);
});
builder.Services.AddHostedService<RedisHostedService>();

// RabbitMQ cconfig
builder.Services.AddSingleton<RabbitMqHostedService>();
builder.Services.AddHostedService<RabbitMqHostedService>(sp => sp.GetRequiredService<RabbitMqHostedService>());

// RabbitMQ Consumer
builder.Services.AddHostedService<UserRequestConsumer>();
builder.Services.AddHostedService<UserBatchRequestConsumer>();
builder.Services.AddHostedService<UserAllRequestConsumer>();

// repo
builder.Services.AddHostedService<DynamoDbHostedService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserOptCacheRepository, UserOptCacheRepository>();
builder.Services.AddScoped<IUserCacheRepository, UserCacheRepository>();

// email configuration
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

// services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<UserMapper>();
builder.Services.AddScoped<JwtUtil>();
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<GoogleTokenVerifier>(sp =>
    new GoogleTokenVerifier(sp.GetRequiredService<IGoogleTokenValidator>()));
builder.Services.AddScoped<IUserQuery, UserQuery>();
builder.Services.AddScoped<IUserCommand, UserCommand>();

// JWT Bearer authentication (required for [Authorize] endpoints e.g. grant-account)
var jwtSecret = builder.Configuration["Jwt:JwtSecret"] ??
    throw new InvalidOperationException("Jwt:JwtSecret is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AuthService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AcasService";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// CORS — read from config (CorsOrigin from appsettings.json)
var corsOrigin = builder.Configuration["Cors:CorsOrigin"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Auth Service API",
        Version = "v1",
        Description = "Authentication and Authorization Service"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", hostDocument: null, externalResource: null),
            new List<string>()
        }
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
var authPolicy = rateLimitingSection.GetSection("AuthPolicy");

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

    // Policy for authentication endpoints
    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = authPolicy.GetValue<int>("PermitLimit", 5),
                Window = TimeSpan.Parse(authPolicy.GetValue<string>("Window") ?? "00:01:00"),
                QueueLimit = authPolicy.GetValue<int>("QueueLimit", 0)
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
        c.PreSerializeFilters.Add((swaggerDoc, httpReq) =>
        {
            const string gatewayPrefix = "/api/auth/v1";

            var prefixedPaths = new OpenApiPaths();
            foreach (var path in swaggerDoc.Paths)
            {
                var originalPath = path.Key;
                var trimmedPath = originalPath.StartsWith("/api/v1", StringComparison.OrdinalIgnoreCase)
                    ? originalPath["/api/v1".Length..]
                    : originalPath;

                if (!trimmedPath.StartsWith("/"))
                {
                    trimmedPath = "/" + trimmedPath;
                }

                prefixedPaths.Add($"{gatewayPrefix}{trimmedPath}", path.Value);
            }

            swaggerDoc.Paths = prefixedPaths;
        });
    });

    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth Service API");
        c.RoutePrefix = "swagger";
        c.ConfigObject.DisplayRequestDuration = true;
    });
}

app.MapGet("/openapi/v1.json", (HttpContext context) =>
{
    context.Response.Redirect("/swagger/v1/swagger.json", permanent: false);
});

app.UseRouting();
app.UseCors();
app.UseRateLimiter();
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
