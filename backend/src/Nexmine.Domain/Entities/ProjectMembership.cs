namespace Nexmine.Domain.Entities;

public class ProjectMembership : BaseEntity
{
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public int RoleId { get; set; }

    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
