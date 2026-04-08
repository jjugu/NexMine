namespace Nexmine.Application.Features.Admin.Dtos;

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string[]? Permissions { get; set; }
}
