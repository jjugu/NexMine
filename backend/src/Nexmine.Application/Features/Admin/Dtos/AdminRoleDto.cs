namespace Nexmine.Application.Features.Admin.Dtos;

public class AdminRoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string[] Permissions { get; set; } = [];
}
