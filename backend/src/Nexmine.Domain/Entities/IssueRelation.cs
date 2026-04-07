using Nexmine.Domain.Enums;

namespace Nexmine.Domain.Entities;

public class IssueRelation : BaseEntity
{
    public int IssueFromId { get; set; }
    public int IssueToId { get; set; }
    public IssueRelationType RelationType { get; set; }
    public int? Delay { get; set; }

    public Issue IssueFrom { get; set; } = null!;
    public Issue IssueTo { get; set; } = null!;
}
