using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();
builder.Services.AddHealthChecks();
builder.Services.AddSwaggerGen();

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);
// ocelot config - use ocelot.prod.json in Docker containers, ocelot.json for dotnet run locally
var useProdOcelot = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OCELOT_USE_PROD"));
var ocelotFile = useProdOcelot ? "ocelot.prod.json" : "ocelot.json";
builder.Configuration.AddJsonFile(ocelotFile, optional: false, reloadOnChange: true);
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.MapGet("/.well-known/{**rest}", () => Results.NoContent());

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/auth/swagger.json", "Auth Service API");
        c.SwaggerEndpoint("/swagger/acas/swagger.json", "ACAS Service API");
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Gateway");
        c.RoutePrefix = "swagger";
        c.ConfigObject.DisplayRequestDuration = true;
    });
    
    app.MapWhen(ctx => ctx.Request.Path.Value == "/swagger/v1/swagger.json", 
        appBuilder =>
        {
            appBuilder.UseSwagger(c =>
            {
                c.RouteTemplate = "swagger/{documentName}/swagger.json";
            });
        });
}


app.UseWebSockets();
await app.UseOcelot();
app.Run();
