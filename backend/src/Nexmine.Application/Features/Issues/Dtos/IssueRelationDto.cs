namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueRelationDto
{
    public int Id { get; set; }
    public int IssueFromId { get; set; }
    public int IssueToId { get; set; }
    public int RelationType { get; set; }
    public int? Delay { get; set; }
}
