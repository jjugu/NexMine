namespace Nexmine.Application.Features.Issues.Dtos;

public class CreateIssueRelationRequest
{
    public int IssueToId { get; set; }
    public int RelationType { get; set; }
    public int? Delay { get; set; }
}
