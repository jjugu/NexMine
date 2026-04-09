namespace Nexmine.Application.Features.Groups.Dtos;

public class UserGroupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? AdminUserId { get; set; }
    public string? AdminUserName { get; set; }
    public int MemberCount { get; set; }
    public List<GroupMemberDto> Members { get; set; } = [];
}
