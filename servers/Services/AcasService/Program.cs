using AcasService.Application.Commands.Classroom;
using AcasService.Application.Commands.Examination;
using AcasService.Application.Commands.OCR;
using AcasService.Application.Commands.Problem;
using AcasService.Application.Commands.ProgrammingLanguage;
using AcasService.Application.Commands.S3;
using AcasService.Application.Commands.Subject;
using AcasService.Application.Mappers;
using AcasService.Application.Queries.Classroom;
using AcasService.Application.Queries.Examination;
using AcasService.Application.Queries.Problem;
using AcasService.Application.Queries.ProgrammingLanguage;
using AcasService.Application.Queries.S3;
using AcasService.Application.Queries.Subject;
using AcasService.Application.Queries.DiscussionIssue;
using AcasService.Application.Utils;
using AcasService.Messaging;
using AcasService.Messaging.User;
using AcasService.Repositories.Classroom;
using AcasService.Repositories.ClassroomEnrollment;
using AcasService.Repositories.DiscussionIssue;
using AcasService.Repositories.DynamoDB;
using AcasService.Repositories.Examination;
using AcasService.Repositories.Problem;
using AcasService.Repositories.ProgrammingLanguage;
using AcasService.Repositories.Redis;
using AcasService.Repositories.S3;
using AcasService.Repositories.Subject;
using AcasService.Repositories.Submission;
using AcasService.Repositories.Notification;
using Amazon;
using Amazon.DynamoDBv2;
using Amazon.Extensions.NETCore.Setup;
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
// using Microsoft.OpenApi.Models;
using Microsoft.OpenApi;
using StackExchange.Redis;
using System.Text;
using System.Threading.RateLimiting;
using AcasService.Application.CodeRunner;
using AcasService.Application.Commands.ClassEnrollments;
using AcasService.Application.Commands.SlotCommand;
using AcasService.Repositories.Slot;
using AcasService.Application.Queries.ClassEnrollments;
using AcasService.Application.Queries.Slot;
using AcasService.Application.Commands.Material;
using AcasService.Application.Queries.Material;
using AcasService.Repositories.Material;
using AcasService.Application.Commands.Submission;
using AcasService.Application.Commands.DiscussionIssue;
using AcasService.Application.Thirdparty;
using AcasService.Application.Queries.Submission;
using AcasService.Repositories.Caching.Redis.Submission;
using AcasService.Dev;


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
builder.Services.AddAWSService<IAmazonS3>(awsOptions);

// Redis configuration
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ??
                           throw new InvalidOperationException("Redis:ConnectionString is not configured");
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    return ConnectionMultiplexer.Connect(redisConnectionString);
});
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
});
builder.Services.AddHostedService<RedisHostedService>();
builder.Services.AddSingleton<RabbitMqHostedService>();
builder.Services.AddHostedService<RabbitMqHostedService>(sp => sp.GetRequiredService<RabbitMqHostedService>());

// RabbitMQ Producer
builder.Services.AddSingleton<UserRequestProducer>();

// JWT Authentication Configuration
var jwtSecret = builder.Configuration["Jwt:JwtSecret"] ??
                throw new InvalidOperationException("Jwt:JwtSecret is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AuthService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AcasService";

// Repositories
builder.Services.AddHostedService<DynamoDbHostedService>();
builder.Services.AddScoped<IPrivateS3Repository, PrivateS3Repository>();
builder.Services.AddScoped<IPublicS3Repository, PublicS3Repository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<IClassroomRepository, ClassroomRepository>();
builder.Services.AddScoped<IProgrammingLanguageRepository, ProgrammingLanguageRepository>();
builder.Services.AddScoped<IExaminationRepository, ExaminationRepository>();
builder.Services.AddScoped<IProblemRepository, ProblemRepository>();
builder.Services.AddScoped<IClassroomEnrollmentRepository, ClassroomEnrollmentRepository>();
builder.Services.AddScoped<ISlotRepository,SlotRepository>();
builder.Services.AddScoped<IMaterialRepository, MaterialRepository>();
builder.Services.AddScoped<IDiscussionIssueRepository, DiscussionIssueRepository>();
builder.Services.AddScoped<IDiscussionIssueQuery, DiscussionIssueQuery>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IDynamoDbResetService, DynamoDbResetService>();

// cahing
builder.Services.AddScoped<ISubmissionCache, SubmissionCache>();

// Command and Query
builder.Services.AddScoped<IPrivateS3Command, PrivateS3Command>();
builder.Services.AddScoped<IPublicS3Command, PublicS3Command>();
builder.Services.AddScoped<IPrivateS3Query, PrivateS3Query>();
builder.Services.AddScoped<ISubjectCommand, SubjectCommand>();
builder.Services.AddScoped<ISubjectQuery, SubjectQuery>();
builder.Services.AddScoped<IClassroomCommand, ClassroomCommand>();  
builder.Services.AddScoped<IClassroomQuery, ClassroomQuery>();
builder.Services.AddScoped<IExaminationCommand, ExaminationCommand>();
builder.Services.AddScoped<IExaminationQuery, ExaminationQuery>();
builder.Services.AddScoped<IProgrammingLanguageCommand, ProgrammingLanguageCommand>();
builder.Services.AddScoped<IProgrammingLanguageQuery, ProgrammingLanguageQuery>();
builder.Services.AddScoped<IProblemCommand, ProblemCommand>();
builder.Services.AddScoped<IProblemQuery, ProblemQuery>();
builder.Services.AddScoped<ITestcaseGenerator, TestcaseGenerator>();
builder.Services.AddScoped<ITestcaseCommand, TestcaseCommand>();
builder.Services.AddScoped<IClassEnrollmentsCommand, ClassEnrollmentsCommand>();
builder.Services.AddScoped<IClassEnrollmentsQuery, ClassEnrollmentsQuery>();
builder.Services.AddScoped<ISlotCommand, SlotCommand>();
builder.Services.AddScoped<ISlotQuery, SlotQuery>();
builder.Services.AddScoped<IMaterialCommand, MaterialCommand>();
builder.Services.AddScoped<IMaterialQuery, MaterialQuery>();
builder.Services.AddScoped<IAzureOcrCommand, AzureOcrCommand>();
builder.Services.AddScoped<IProblemOcrCommand, ProblemOcrCommand>();
builder.Services.AddScoped<ITestcaseEvaluator, TestcaseEvaluator>();
builder.Services.AddScoped<IResultComparator, ResultComparator>();
builder.Services.AddScoped<IExecutionCommand, ExecutionCommand>();
builder.Services.AddScoped<IDiscussionIssueCommand, DiscussionIssueCommand>();
builder.Services.AddScoped<ISubmissionCommand, SubmissionCommand>();
builder.Services.AddScoped<ISubmissionQuery, SubmissionQuery>();
builder.Services.AddScoped<ISubmissionCommand, SubmissionCommand>();

// mapper
builder.Services.AddScoped<ProblemMapper>();
builder.Services.AddScoped<SlotMapper>();
builder.Services.AddScoped<SubjectMapper>();
builder.Services.AddScoped<ClassroomMapper>();
builder.Services.AddScoped<ProgrammingLanguageMapper>();
builder.Services.AddScoped<ExaminationMapper>();
builder.Services.AddScoped<MaterialMapper>();
builder.Services.AddScoped<CommentMapper>();
builder.Services.AddScoped<DiscussionIssueMapper>();
builder.Services.AddScoped<TestResultMapper>();
builder.Services.AddScoped<SubmissionMapper>();
builder.Services.AddScoped<ClassEnrollmentMapper>();

// code runner service 
builder.Services.AddHttpClient<ICodeRunnerService, CodeRunnerService>();
builder.Services.AddHttpClient<ICompilationApi, CompilationApi>();
builder.Services.AddHttpClient<IGeminiClient, GeminiClient>();

// Azure Form Recognizer configuration
var azureEndpoint = builder.Configuration["AzureFormRecognizer:Endpoint"] ??
                   throw new InvalidOperationException("AzureFormRecognizer:Endpoint is not configured");
var azureApiKey = builder.Configuration["AzureFormRecognizer:ApiKey"] ??
                 throw new InvalidOperationException("AzureFormRecognizer:ApiKey is not configured");

builder.Services.AddSingleton(new AzureFormRecognizerConfig
{
    Endpoint = azureEndpoint,
    ApiKey = azureApiKey
});

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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:8080")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo  
    {
        Title = "ACAS Service API",
        Version = "v1",
        Description = "ACAS Service API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
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
        c.PreSerializeFilters.Add((swaggerDoc, httpReq) =>
        {
            const string gatewayPrefix = "/api/acas/v1";

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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ACAS Service API");
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