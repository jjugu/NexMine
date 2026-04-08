namespace Nexmine.Application.Features.IssueTemplates.Dtos;

public class IssueTemplateDto
{
    public int Id { get; set; }
    public int TrackerId { get; set; }
    public string TrackerName { get; set; } = string.Empty;
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? SubjectTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public bool IsDefault { get; set; }
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
