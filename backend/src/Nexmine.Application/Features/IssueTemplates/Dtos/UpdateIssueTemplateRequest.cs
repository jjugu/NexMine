namespace Nexmine.Application.Features.IssueTemplates.Dtos;

public class UpdateIssueTemplateRequest
{
    public string? Title { get; set; }
    public string? SubjectTemplate { get; set; }
    public string? DescriptionTemplate { get; set; }
    public bool? IsDefault { get; set; }
    public int? Position { get; set; }
}
