namespace Nexmine.Application.Features.Admin.Dtos;

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? PermissionsJson { get; set; }
}
