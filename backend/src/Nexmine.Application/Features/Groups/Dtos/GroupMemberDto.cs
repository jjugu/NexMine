namespace Nexmine.Application.Features.Groups.Dtos;

public class GroupMemberDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
