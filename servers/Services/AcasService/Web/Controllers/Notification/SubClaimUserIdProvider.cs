using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace AcasService.Web.Controllers.Notification;

/// <summary>
/// Resolves the SignalR user identifier from JWT claims so that
/// IHubContext.Clients.User(userId) targets the correct connection.
/// Falls back through standard claim types to the custom "id" claim
/// used by AuthService's JwtUtil.
/// </summary>
public class SubClaimUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? connection.User?.FindFirst("sub")?.Value
            ?? connection.User?.FindFirst("id")?.Value;
    }
}
