namespace Nexmine.Application.Features.Groups.Dtos;

public class UpdateUserGroupRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? AdminUserId { get; set; }
}
