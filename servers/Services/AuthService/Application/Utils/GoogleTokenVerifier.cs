using Google.Apis.Auth;

namespace AuthService.Application.Utils;

public class GoogleTokenPayload
{
    public string Email { get; set; } = string.Empty;
    public string GoogleId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Picture { get; set; }
}

public interface IGoogleTokenVerifier
{
    Task<GoogleTokenPayload> VerifyTokenAsync(string idToken);
}

public class GoogleTokenVerifier : IGoogleTokenVerifier
{
    private readonly string _clientId;
    private readonly ILogger<GoogleTokenVerifier> _logger;

    public GoogleTokenVerifier(IConfiguration configuration, ILogger<GoogleTokenVerifier> logger)
    {
        var clientId = configuration["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId))
        {
            throw new InvalidOperationException("Google:ClientId is not configured");
        }
        _clientId = clientId;
        _logger = logger;
    }

    public async Task<GoogleTokenPayload> VerifyTokenAsync(string idToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            _logger.LogError("Google token is null, empty, or whitespace");
            throw new InvalidOperationException("Invalid Google token");
        }

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
            throw new InvalidOperationException("Invalid Google token", ex);
        }
    }
}
