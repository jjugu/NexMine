namespace Nexmine.Application.Features.Groups.Dtos;

public class CreateUserGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int[] MemberUserIds { get; set; } = [];
}
