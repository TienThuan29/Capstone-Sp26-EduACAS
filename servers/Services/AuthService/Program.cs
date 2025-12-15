using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
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

var builder = WebApplication.CreateBuilder(args);

// config AWS DynamoDB
var awsRegion = builder.Configuration["AWS:Region"] ??
                throw new InvalidOperationException("AWS_REGION is not configured");
var awsAccessKey = builder.Configuration["AWS:AccessKey"] ??
                   throw new InvalidOperationException("AWS_ACCESS_KEY is not configured");
var awsSecretKey = builder.Configuration["AWS:SecretKey"] ??
                   throw new InvalidOperationException("AWS_SECRET_KEY is not configured");

var regionEndpoint = RegionEndpoint.GetBySystemName(awsRegion);
var awsOptions = new AWSOptions
{
    Region = regionEndpoint
};

if (!string.IsNullOrEmpty(awsAccessKey) && !string.IsNullOrEmpty(awsSecretKey))
{
    awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(awsAccessKey, awsSecretKey);
}

builder.Services.AddAWSService<IAmazonDynamoDB>(awsOptions);

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

// repo
builder.Services.AddHostedService<DynamoDbHostedService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
// services
builder.Services.AddScoped<UserMapper>();
builder.Services.AddScoped<JwtUtil>();
builder.Services.AddScoped<IUserQuery, UserQuery>();
builder.Services.AddScoped<IUserCommand, UserCommand>();
// controllers
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

    // Policy for authentication endpoints (more restrictive)
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

app.UseCors();
app.UseRouting();
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
