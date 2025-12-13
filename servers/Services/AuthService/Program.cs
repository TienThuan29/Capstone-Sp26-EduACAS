using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using AuthService.Application.Commands;
using AuthService.Application.Mappers;
using AuthService.Application.Queries;
using AuthService.Application.Utils;
using AuthService.Repositories.User;

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
builder.Services.AddHealthChecks();

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
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
