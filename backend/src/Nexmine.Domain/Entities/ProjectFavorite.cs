namespace Nexmine.Domain.Entities;

public class ProjectFavorite
{
    public int UserId { get; set; }
    public int ProjectId { get; set; }

    public User User { get; set; } = null!;
    public Project Project { get; set; } = null!;
}
