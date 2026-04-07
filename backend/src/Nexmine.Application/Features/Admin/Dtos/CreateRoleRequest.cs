namespace Nexmine.Application.Features.Admin.Dtos;

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? PermissionsJson { get; set; }
}
