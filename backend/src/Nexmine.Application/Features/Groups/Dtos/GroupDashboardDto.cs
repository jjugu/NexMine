namespace Nexmine.Application.Features.Groups.Dtos;

public class GroupDashboardDto
{
    public int GroupId { get; set; }
    public string GroupName { get; set; } = "";
    public List<MemberStatsDto> MemberStats { get; set; } = [];
    public List<MonthlyTrendDto> MonthlyTrend { get; set; } = [];
    public List<TrackerDistributionDto> TrackerDistribution { get; set; } = [];
    public GroupSummaryDto Summary { get; set; } = new();
}

public class MemberStatsDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = "";
    public int ClosedIssueCount { get; set; }
    public int OpenIssueCount { get; set; }
    public decimal TotalHours { get; set; }
}

public class MonthlyTrendDto
{
    public string Month { get; set; } = "";
    public int ClosedCount { get; set; }
    public int CreatedCount { get; set; }
}

public class TrackerDistributionDto
{
    public string TrackerName { get; set; } = "";
    public int Count { get; set; }
}

public class GroupSummaryDto
{
    public int TotalMembers { get; set; }
    public int TotalClosedIssues { get; set; }
    public int TotalOpenIssues { get; set; }
    public decimal TotalHours { get; set; }
}
