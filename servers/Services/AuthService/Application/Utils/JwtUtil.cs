using System.Text;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace AuthService.Application.Utils;

public class JwtUtil
{
    private readonly string _secret;
    private readonly string _accessTokenExpiration;
    private readonly string _refreshTokenExpiration;
    private readonly string _issuer;
    private readonly string _audience;
  
    public JwtUtil(IConfiguration configuration)
    {
        _secret = configuration["Jwt:JwtSecret"] ?? 
                  throw new InvalidOperationException("JWT_SECRET is not configured");
        _accessTokenExpiration = configuration["Jwt:JwtAccessTokenExpiration"] ?? "1d";
        _refreshTokenExpiration = configuration["Jwt:JwtRefreshTokenExpiration"] ?? "7d";
        _issuer = configuration["Jwt:Issuer"] ?? "AuthService";
        _audience = configuration["Jwt:Audience"] ?? "AcasService";
    }
    
    public string GenerateAccessToken(JwtPayload payload)
    {
        return GenerateToken(payload, _accessTokenExpiration);
    }

    public string GenerateRefreshToken(JwtPayload payload)
    {
        return GenerateToken(payload, _refreshTokenExpiration);
    }
    
    private string GenerateToken(JwtPayload payload, string expiration)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secret);

        var claims = new List<Claim>
        {
            new Claim("id", payload.Id),
            new Claim("email", payload.Email),
            new Claim("role", payload.Role),
            new Claim(ClaimTypes.Name, payload.Email), // Add name claim for Identity.Name
            new Claim(ClaimTypes.Role, payload.Role)   // Add standard role claim
        };

        var expires = ParseExpiration(expiration);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    
    private DateTime ParseExpiration(string expiration)
    {
        if (expiration.EndsWith("d"))
        {
            var days = int.Parse(expiration[..^1]);
            return DateTime.UtcNow.AddDays(days);
        }
        else if (expiration.EndsWith("h"))
        {
            var hours = int.Parse(expiration[..^1]);
            return DateTime.UtcNow.AddHours(hours);
        }
        else if (expiration.EndsWith("m"))
        {
            var minutes = int.Parse(expiration[..^1]);
            return DateTime.UtcNow.AddMinutes(minutes);
        }
        else if (expiration.EndsWith("s"))
        {
            var seconds = int.Parse(expiration[..^1]);
            return DateTime.UtcNow.AddSeconds(seconds);
        }
        else
        {
            return DateTime.UtcNow.AddDays(1);
        }
    }
    
    public async Task<JwtPayload> VerifyAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            };

            var principal = await tokenHandler.ValidateTokenAsync(token, validationParameters);
            var jwtToken = (JwtSecurityToken)principal.SecurityToken;

            return new JwtPayload
            {
                Id = jwtToken.Claims.First(x => x.Type == "id").Value,
                Email = jwtToken.Claims.First(x => x.Type == "email").Value,
                Role = jwtToken.Claims.First(x => x.Type == "role").Value
            };
        }
        catch (Exception ex)
        {
            throw new SecurityTokenException($"Invalid token: {ex.Message}");
        }
    }
}

public class JwtPayload
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}