namespace Nexmine.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    public List<RefreshToken> RefreshTokens { get; set; } = [];
    public List<ProjectMembership> ProjectMemberships { get; set; } = [];
}
