namespace Nexmine.Application.Features.Dashboard.Dtos;

public class DashboardDto
{
    public List<DashboardIssueDto> MyIssues { get; set; } = [];
    public List<DashboardIssueDto> OverdueIssues { get; set; } = [];
    public List<StatusCountDto> IssuesByStatus { get; set; } = [];
    public List<PriorityCountDto> IssuesByPriority { get; set; } = [];
    public int TotalIssueCount { get; set; }
}

public class DashboardIssueDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? ProjectName { get; set; }
    public string? ProjectIdentifier { get; set; }
    public string? StatusName { get; set; }
    public string? PriorityName { get; set; }
    public string? AssignedToName { get; set; }
    public DateOnly? DueDate { get; set; }
    public int DoneRatio { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class StatusCountDto
{
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public bool IsClosed { get; set; }
}

public class PriorityCountDto
{
    public string PriorityName { get; set; } = string.Empty;
    public int Count { get; set; }
}
