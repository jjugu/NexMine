namespace Nexmine.Domain.Entities;

public class Journal : BaseEntity
{
    public int IssueId { get; set; }
    public int UserId { get; set; }
    public string? Notes { get; set; }

    public Issue Issue { get; set; } = null!;
    public User User { get; set; } = null!;
    public List<JournalDetail> Details { get; set; } = [];
}
