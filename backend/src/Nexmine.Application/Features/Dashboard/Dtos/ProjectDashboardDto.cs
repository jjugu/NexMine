namespace Nexmine.Application.Features.Dashboard.Dtos;

public class ProjectDashboardDto
{
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectIdentifier { get; set; } = string.Empty;
    public List<DashboardIssueDto> MyIssues { get; set; } = [];
    public List<DashboardIssueDto> OverdueIssues { get; set; } = [];
    public List<StatusCountDto> IssuesByStatus { get; set; } = [];
    public List<PriorityCountDto> IssuesByPriority { get; set; } = [];
    public List<VersionProgressDto> VersionProgress { get; set; } = [];
    public int TotalIssueCount { get; set; }
}

public class VersionProgressDto
{
    public int VersionId { get; set; }
    public string VersionName { get; set; } = string.Empty;
    public int TotalIssues { get; set; }
    public int ClosedIssues { get; set; }
    public int OpenIssues { get; set; }
    public DateOnly? DueDate { get; set; }
}
