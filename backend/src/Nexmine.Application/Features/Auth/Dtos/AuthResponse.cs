namespace Nexmine.Application.Features.Auth.Dtos;

public class AuthResponse
{
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public UserDto? User { get; set; }
    public bool RequiresApproval { get; set; }
}
