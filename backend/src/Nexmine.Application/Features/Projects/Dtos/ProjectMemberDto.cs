namespace Nexmine.Application.Features.Projects.Dtos;

public class ProjectMemberDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
}
