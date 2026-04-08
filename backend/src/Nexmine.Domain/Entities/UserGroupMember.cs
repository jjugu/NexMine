namespace Nexmine.Domain.Entities;

public class UserGroupMember
{
    public int GroupId { get; set; }
    public int UserId { get; set; }

    public UserGroup Group { get; set; } = null!;
    public User User { get; set; } = null!;
}
