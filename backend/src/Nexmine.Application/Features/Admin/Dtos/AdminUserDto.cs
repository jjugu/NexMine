namespace Nexmine.Application.Features.Admin.Dtos;

public class AdminUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
