using Google.Apis.Auth;

namespace AuthService.Application.Utils;

public class GoogleTokenVerifier
{
    private readonly string _clientId;
    private readonly ILogger<GoogleTokenVerifier> _logger;

    public GoogleTokenVerifier(IConfiguration configuration, ILogger<GoogleTokenVerifier> logger)
    {
        _clientId = configuration["Google:ClientId"] ?? 
                   throw new InvalidOperationException("Google:ClientId is not configured");
        _logger = logger;
    }

    public async Task<GoogleTokenPayload> VerifyTokenAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _clientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            return new GoogleTokenPayload
            {
                Email = payload.Email,
                GoogleId = payload.Subject,
                Name = payload.Name,
                Picture = payload.Picture
            };
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogError(ex, "Invalid Google token");
            throw new InvalidOperationException("Invalid Google token", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Google token");
            throw new InvalidOperationException("Error verifying Google token", ex);
        }
    }
}

public class GoogleTokenPayload
{
    public string Email { get; set; } = string.Empty;
    public string GoogleId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Picture { get; set; }
}
