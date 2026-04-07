using Nexmine.Application.Features.Auth.Dtos;

namespace Nexmine.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress);
    Task<AuthResponse> RefreshAsync(string refreshToken, string? ipAddress);
    Task LogoutAsync(string refreshToken);
    Task<UserDto> GetCurrentUserAsync(int userId);
}
