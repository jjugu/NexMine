using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Dashboard.Dtos;
using Nexmine.Application.Features.Dashboard.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly NexmineDbContext _dbContext;

    public DashboardService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardDto> GetGlobalDashboardAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // My issues: assigned to current user AND not closed
        var myIssues = await _dbContext.Issues
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.AssignedToId == userId && !i.Status.IsClosed)
            .OrderByDescending(i => i.UpdatedAt)
            .Take(20)
            .Select(i => MapToDashboardIssueDto(i))
            .ToListAsync();

        // Overdue issues: DueDate < today AND not closed, scoped to user's projects
        var userProjectIds = await _dbContext.ProjectMemberships
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync();

        var overdueIssues = await _dbContext.Issues
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.DueDate.HasValue
                && i.DueDate.Value < today
                && !i.Status.IsClosed
                && userProjectIds.Contains(i.ProjectId))
            .OrderBy(i => i.DueDate)
            .Take(20)
            .Select(i => MapToDashboardIssueDto(i))
            .ToListAsync();

        // Issues by status (across user's projects)
        var issuesByStatus = await _dbContext.Issues
            .Include(i => i.Status)
            .Where(i => userProjectIds.Contains(i.ProjectId))
            .GroupBy(i => new { i.Status.Name, i.Status.IsClosed })
            .Select(g => new StatusCountDto
            {
                StatusName = g.Key.Name,
                IsClosed = g.Key.IsClosed,
                Count = g.Count()
            })
            .ToListAsync();

        // Issues by priority (across user's projects)
        var issuesByPriority = await _dbContext.Issues
            .Include(i => i.Priority)
            .Where(i => userProjectIds.Contains(i.ProjectId))
            .GroupBy(i => i.Priority.Name)
            .Select(g => new PriorityCountDto
            {
                PriorityName = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        var totalCount = await _dbContext.Issues
            .Where(i => userProjectIds.Contains(i.ProjectId))
            .CountAsync();

        return new DashboardDto
        {
            MyIssues = myIssues,
            OverdueIssues = overdueIssues,
            IssuesByStatus = issuesByStatus,
            IssuesByPriority = issuesByPriority,
            TotalIssueCount = totalCount
        };
    }

    public async Task<ProjectDashboardDto> GetProjectDashboardAsync(string identifier, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{identifier}'를 찾을 수 없습니다.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // My issues in this project
        var myIssues = await _dbContext.Issues
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.ProjectId == project.Id && i.AssignedToId == userId && !i.Status.IsClosed)
            .OrderByDescending(i => i.UpdatedAt)
            .Take(20)
            .Select(i => MapToDashboardIssueDto(i))
            .ToListAsync();

        // Overdue issues in this project
        var overdueIssues = await _dbContext.Issues
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.ProjectId == project.Id
                && i.DueDate.HasValue
                && i.DueDate.Value < today
                && !i.Status.IsClosed)
            .OrderBy(i => i.DueDate)
            .Take(20)
            .Select(i => MapToDashboardIssueDto(i))
            .ToListAsync();

        // Issues by status for this project
        var issuesByStatus = await _dbContext.Issues
            .Include(i => i.Status)
            .Where(i => i.ProjectId == project.Id)
            .GroupBy(i => new { i.Status.Name, i.Status.IsClosed })
            .Select(g => new StatusCountDto
            {
                StatusName = g.Key.Name,
                IsClosed = g.Key.IsClosed,
                Count = g.Count()
            })
            .ToListAsync();

        // Issues by priority for this project
        var issuesByPriority = await _dbContext.Issues
            .Include(i => i.Priority)
            .Where(i => i.ProjectId == project.Id)
            .GroupBy(i => i.Priority.Name)
            .Select(g => new PriorityCountDto
            {
                PriorityName = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        // Version progress
        var versionProgress = await _dbContext.Versions
            .Where(v => v.ProjectId == project.Id)
            .Select(v => new VersionProgressDto
            {
                VersionId = v.Id,
                VersionName = v.Name,
                TotalIssues = v.Issues.Count,
                ClosedIssues = v.Issues.Count(i => i.Status.IsClosed),
                OpenIssues = v.Issues.Count(i => !i.Status.IsClosed),
                DueDate = v.DueDate
            })
            .ToListAsync();

        var totalCount = await _dbContext.Issues
            .Where(i => i.ProjectId == project.Id)
            .CountAsync();

        return new ProjectDashboardDto
        {
            ProjectName = project.Name,
            ProjectIdentifier = project.Identifier,
            MyIssues = myIssues,
            OverdueIssues = overdueIssues,
            IssuesByStatus = issuesByStatus,
            IssuesByPriority = issuesByPriority,
            VersionProgress = versionProgress,
            TotalIssueCount = totalCount
        };
    }

    private static DashboardIssueDto MapToDashboardIssueDto(Domain.Entities.Issue issue)
    {
        return new DashboardIssueDto
        {
            Id = issue.Id,
            Subject = issue.Subject,
            ProjectName = issue.Project.Name,
            ProjectIdentifier = issue.Project.Identifier,
            StatusName = issue.Status.Name,
            PriorityName = issue.Priority.Name,
            AssignedToName = issue.AssignedTo != null
                ? $"{issue.AssignedTo.FirstName} {issue.AssignedTo.LastName}".Trim()
                : null,
            DueDate = issue.DueDate,
            DoneRatio = issue.DoneRatio,
            UpdatedAt = issue.UpdatedAt
        };
    }
}
