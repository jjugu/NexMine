namespace Nexmine.Application.Features.Admin.Dtos;

public class PermissionListResponse
{
    public Dictionary<string, string[]> Groups { get; set; } = new();
    public Dictionary<string, string> Labels { get; set; } = new();
}
