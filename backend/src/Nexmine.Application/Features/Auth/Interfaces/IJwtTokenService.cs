using Nexmine.Domain.Entities;

namespace Nexmine.Application.Features.Auth.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    int? ValidateRefreshToken(string token);
}
