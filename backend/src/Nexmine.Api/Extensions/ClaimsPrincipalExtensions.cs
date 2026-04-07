using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Nexmine.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirst(ClaimTypes.NameIdentifier);

        if (claim is null || !int.TryParse(claim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim not found.");
        }

        return userId;
    }
}
