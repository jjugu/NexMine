namespace Nexmine.Application.Features.Issues.Dtos;

public class ImportIssuesResult
{
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Errors { get; set; } = [];
}
