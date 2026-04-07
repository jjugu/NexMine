namespace Nexmine.Application.Features.Activities.Dtos;

public class ActivityDto
{
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string? ProjectIdentifier { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public DateTime CreatedAt { get; set; }

    // Issue metadata
    public int? IssueId { get; set; }
    public string? IssueSubject { get; set; }

    // Wiki metadata
    public string? WikiSlug { get; set; }
    public string? WikiTitle { get; set; }

    // Document metadata
    public int? DocumentId { get; set; }
    public string? DocumentTitle { get; set; }
}
