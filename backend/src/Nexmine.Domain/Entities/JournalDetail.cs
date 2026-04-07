namespace Nexmine.Domain.Entities;

public class JournalDetail : BaseEntity
{
    public int JournalId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    public Journal Journal { get; set; } = null!;
}
