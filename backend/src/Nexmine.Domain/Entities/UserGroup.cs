namespace Nexmine.Domain.Entities;

public class UserGroup : BaseEntity
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }

    public ICollection<UserGroupMember> Members { get; set; } = new List<UserGroupMember>();
}
