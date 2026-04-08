using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Charts.Dtos;
using Nexmine.Application.Features.Charts.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ChartService : IChartService
{
    private readonly NexmineDbContext _dbContext;

    public ChartService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IssueTrendDto> GetIssueTrendAsync(string projectIdentifier, int days)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(days - 1));

        // Created issues per day
        var createdPerDay = await _dbContext.Issues
            .Where(i => i.ProjectId == project.Id && i.CreatedAt >= startDate)
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count);

        // Closed issues per day: find journal details where StatusId changed to a closed status
        var closedStatusIds = await _dbContext.IssueStatuses
            .Where(s => s.IsClosed)
            .Select(s => s.Id.ToString())
            .ToListAsync();

        var closedPerDay = await _dbContext.JournalDetails
            .Include(jd => jd.Journal)
            .Where(jd => jd.PropertyName == "StatusId"
                && jd.NewValue != null
                && closedStatusIds.Contains(jd.NewValue)
                && jd.Journal.Issue.ProjectId == project.Id
                && jd.CreatedAt >= startDate)
            .GroupBy(jd => jd.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count);

        var dates = new List<string>();
        var created = new List<int>();
        var closed = new List<int>();

        for (var d = startDate; d <= today; d = d.AddDays(1))
        {
            dates.Add(d.ToString("yyyy-MM-dd"));
            created.Add(createdPerDay.GetValueOrDefault(d, 0));
            closed.Add(closedPerDay.GetValueOrDefault(d, 0));
        }

        return new IssueTrendDto
        {
            Dates = dates,
            Created = created,
            Closed = closed
        };
    }

    public async Task<BurndownDto> GetBurndownAsync(string projectIdentifier, int versionId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var version = await _dbContext.Versions
            .FirstOrDefaultAsync(v => v.Id == versionId && v.ProjectId == project.Id)
            ?? throw new KeyNotFoundException($"버전을 찾을 수 없습니다.");

        // Get total issues for this version
        var totalIssues = await _dbContext.Issues
            .Where(i => i.VersionId == versionId && i.ProjectId == project.Id)
            .CountAsync();

        if (totalIssues == 0)
        {
            return new BurndownDto();
        }

        // Determine start and end dates
        var firstIssueCreated = await _dbContext.Issues
            .Where(i => i.VersionId == versionId && i.ProjectId == project.Id)
            .MinAsync(i => i.CreatedAt);

        var startDate = firstIssueCreated.Date;
        var today = DateTime.UtcNow.Date;
        var endDate = version.DueDate.HasValue
            ? version.DueDate.Value.ToDateTime(TimeOnly.MinValue)
            : today;

        // Use the later of endDate and today for the chart range
        var chartEnd = endDate >= today ? endDate : today;

        // Get closed status ids
        var closedStatusIds = await _dbContext.IssueStatuses
            .Where(s => s.IsClosed)
            .Select(s => s.Id.ToString())
            .ToListAsync();

        // Get all close events for this version's issues
        var versionIssueIds = await _dbContext.Issues
            .Where(i => i.VersionId == versionId && i.ProjectId == project.Id)
            .Select(i => i.Id)
            .ToListAsync();

        var closeEvents = await _dbContext.JournalDetails
            .Include(jd => jd.Journal)
            .Where(jd => jd.PropertyName == "StatusId"
                && jd.NewValue != null
                && closedStatusIds.Contains(jd.NewValue)
                && versionIssueIds.Contains(jd.Journal.IssueId))
            .Select(jd => jd.CreatedAt.Date)
            .ToListAsync();

        var closedPerDay = closeEvents
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());

        // Build cumulative closed count per day
        var dates = new List<string>();
        var remaining = new List<int>();
        var ideal = new List<int>();

        var totalDays = (chartEnd - startDate).Days;
        var cumulativeClosed = 0;

        for (var d = startDate; d <= chartEnd; d = d.AddDays(1))
        {
            dates.Add(d.ToString("yyyy-MM-dd"));
            cumulativeClosed += closedPerDay.GetValueOrDefault(d, 0);
            remaining.Add(totalIssues - cumulativeClosed);

            // Ideal line: linear decrease from totalIssues to 0
            var dayIndex = (d - startDate).Days;
            var idealValue = totalDays > 0
                ? (int)Math.Round(totalIssues * (1.0 - (double)dayIndex / totalDays))
                : 0;
            ideal.Add(idealValue);
        }

        return new BurndownDto
        {
            Dates = dates,
            Remaining = remaining,
            Ideal = ideal
        };
    }
}
