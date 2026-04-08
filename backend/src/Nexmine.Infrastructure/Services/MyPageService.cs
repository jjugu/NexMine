using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.MyPage.Dtos;
using Nexmine.Application.Features.MyPage.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class MyPageService : IMyPageService
{
    private readonly NexmineDbContext _dbContext;

    private static readonly List<(string Type, int Position, int Column)> DefaultWidgets =
    [
        ("my_issues", 0, 0),
        ("overdue_issues", 1, 0),
        ("watched_issues", 0, 1),
        ("recent_activity", 1, 1)
    ];

    public MyPageService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MyPageDto> GetMyPageAsync(int userId)
    {
        var widgets = await _dbContext.UserDashboardWidgets
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Column)
            .ThenBy(w => w.Position)
            .ToListAsync();

        if (widgets.Count == 0)
        {
            widgets = await CreateDefaultWidgetsAsync(userId);
        }

        var widgetConfigs = widgets.Select(w => new WidgetConfigDto
        {
            Id = w.Id,
            WidgetType = w.WidgetType,
            Position = w.Position,
            Column = w.Column
        }).ToList();

        var activeTypes = widgets.Select(w => w.WidgetType).ToHashSet();
        var data = await LoadWidgetDataAsync(userId, activeTypes);

        return new MyPageDto
        {
            Widgets = widgetConfigs,
            Data = data
        };
    }

    public async Task SaveLayoutAsync(int userId, SaveWidgetLayoutRequest request)
    {
        var existing = await _dbContext.UserDashboardWidgets
            .Where(w => w.UserId == userId)
            .ToListAsync();

        _dbContext.UserDashboardWidgets.RemoveRange(existing);

        var newWidgets = request.Widgets.Select(w => new UserDashboardWidget
        {
            UserId = userId,
            WidgetType = w.WidgetType,
            Position = w.Position,
            Column = w.Column
        }).ToList();

        _dbContext.UserDashboardWidgets.AddRange(newWidgets);
        await _dbContext.SaveChangesAsync();
    }

    private async Task<List<UserDashboardWidget>> CreateDefaultWidgetsAsync(int userId)
    {
        var widgets = DefaultWidgets.Select(d => new UserDashboardWidget
        {
            UserId = userId,
            WidgetType = d.Type,
            Position = d.Position,
            Column = d.Column
        }).ToList();

        _dbContext.UserDashboardWidgets.AddRange(widgets);
        await _dbContext.SaveChangesAsync();
        return widgets;
    }

    private async Task<MyPageDataDto> LoadWidgetDataAsync(int userId, HashSet<string> activeTypes)
    {
        var data = new MyPageDataDto();

        if (activeTypes.Contains("my_issues"))
        {
            data.MyIssues = await LoadMyIssuesAsync(userId);
        }

        if (activeTypes.Contains("watched_issues"))
        {
            data.WatchedIssues = await LoadWatchedIssuesAsync(userId);
        }

        if (activeTypes.Contains("recent_activity"))
        {
            data.RecentActivity = await LoadRecentActivityAsync(userId);
        }

        if (activeTypes.Contains("overdue_issues"))
        {
            data.OverdueIssues = await LoadOverdueIssuesAsync(userId);
        }

        if (activeTypes.Contains("time_entries"))
        {
            data.TimeEntries = await LoadTimeEntriesAsync(userId);
        }

        if (activeTypes.Contains("calendar"))
        {
            data.Calendar = await LoadCalendarAsync(userId);
        }

        return data;
    }

    private async Task<MyIssuesWidgetDto> LoadMyIssuesAsync(int userId)
    {
        var query = _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.AssignedToId == userId && !i.Status.IsClosed);

        var totalCount = await query.CountAsync();

        var issues = await query
            .OrderByDescending(i => i.UpdatedAt)
            .Take(10)
            .Select(i => MapToMyPageIssueDto(i))
            .ToListAsync();

        return new MyIssuesWidgetDto
        {
            TotalCount = totalCount,
            Issues = issues
        };
    }

    private async Task<WatchedIssuesWidgetDto> LoadWatchedIssuesAsync(int userId)
    {
        var watchedIssueIds = await _dbContext.Watchers
            .AsNoTracking()
            .Where(w => w.UserId == userId && w.WatchableType == "issue")
            .Select(w => w.WatchableId)
            .ToListAsync();

        if (watchedIssueIds.Count == 0)
        {
            return new WatchedIssuesWidgetDto { TotalCount = 0, Issues = [] };
        }

        var query = _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => watchedIssueIds.Contains(i.Id) && !i.Status.IsClosed);

        var totalCount = await query.CountAsync();

        var issues = await query
            .OrderByDescending(i => i.UpdatedAt)
            .Take(10)
            .Select(i => MapToMyPageIssueDto(i))
            .ToListAsync();

        return new WatchedIssuesWidgetDto
        {
            TotalCount = totalCount,
            Issues = issues
        };
    }

    private async Task<RecentActivityWidgetDto> LoadRecentActivityAsync(int userId)
    {
        var projectIds = await _dbContext.ProjectMemberships
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync();

        if (projectIds.Count == 0)
        {
            return new RecentActivityWidgetDto { Items = [] };
        }

        var since = DateTime.UtcNow.AddDays(-30);
        var items = new List<ActivityItem>();

        // Issue created
        var issueCreated = await _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Include(i => i.Author)
            .Where(i => projectIds.Contains(i.ProjectId) && i.CreatedAt >= since)
            .OrderByDescending(i => i.CreatedAt)
            .Take(10)
            .Select(i => new ActivityItem
            {
                Type = "issue_created",
                Title = "#" + i.Id + " " + i.Subject,
                ProjectName = i.Project.Name,
                ProjectIdentifier = i.Project.Identifier,
                UserName = i.Author.Username,
                CreatedAt = i.CreatedAt,
                IssueId = i.Id
            })
            .ToListAsync();

        items.AddRange(issueCreated);

        // Issue updated (journals)
        var journalActivities = await _dbContext.Journals
            .AsNoTracking()
            .Include(j => j.Issue).ThenInclude(i => i.Project)
            .Include(j => j.User)
            .Where(j => projectIds.Contains(j.Issue.ProjectId) && j.CreatedAt >= since)
            .OrderByDescending(j => j.CreatedAt)
            .Take(10)
            .Select(j => new ActivityItem
            {
                Type = "issue_updated",
                Title = "#" + j.Issue.Id + " " + j.Issue.Subject,
                Description = j.Notes != null
                    ? (j.Notes.Length > 200 ? j.Notes.Substring(0, 200) + "..." : j.Notes)
                    : null,
                ProjectName = j.Issue.Project.Name,
                ProjectIdentifier = j.Issue.Project.Identifier,
                UserName = j.User.Username,
                CreatedAt = j.CreatedAt,
                IssueId = j.Issue.Id
            })
            .ToListAsync();

        items.AddRange(journalActivities);

        // Sort combined and take top 10
        items = items.OrderByDescending(a => a.CreatedAt).Take(10).ToList();

        return new RecentActivityWidgetDto { Items = items };
    }

    private async Task<OverdueIssuesWidgetDto> LoadOverdueIssuesAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var query = _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.AssignedToId == userId
                && i.DueDate.HasValue
                && i.DueDate.Value < today
                && !i.Status.IsClosed);

        var totalCount = await query.CountAsync();

        var issues = await query
            .OrderBy(i => i.DueDate)
            .Take(10)
            .Select(i => MapToMyPageIssueDto(i))
            .ToListAsync();

        return new OverdueIssuesWidgetDto
        {
            TotalCount = totalCount,
            Issues = issues
        };
    }

    private async Task<TimeEntriesWidgetDto> LoadTimeEntriesAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
        if (today.DayOfWeek == DayOfWeek.Sunday)
        {
            startOfWeek = today.AddDays(-6);
        }
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);

        var entries = await _dbContext.TimeEntries
            .AsNoTracking()
            .Where(te => te.UserId == userId && te.SpentOn >= startOfMonth)
            .ToListAsync();

        var todayHours = entries.Where(te => te.SpentOn == today).Sum(te => te.Hours);
        var weekHours = entries.Where(te => te.SpentOn >= startOfWeek).Sum(te => te.Hours);
        var monthHours = entries.Sum(te => te.Hours);

        return new TimeEntriesWidgetDto
        {
            TodayHours = todayHours,
            WeekHours = weekHours,
            MonthHours = monthHours
        };
    }

    private async Task<CalendarWidgetDto> LoadCalendarAsync(int userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth = new DateOnly(today.Year, today.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var events = await _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Where(i => i.AssignedToId == userId
                && !i.Status.IsClosed
                && ((i.StartDate.HasValue && i.StartDate.Value >= startOfMonth && i.StartDate.Value <= endOfMonth)
                    || (i.DueDate.HasValue && i.DueDate.Value >= startOfMonth && i.DueDate.Value <= endOfMonth)))
            .OrderBy(i => i.StartDate ?? i.DueDate)
            .Select(i => new CalendarEventItem
            {
                IssueId = i.Id,
                Subject = i.Subject,
                ProjectIdentifier = i.Project.Identifier,
                StartDate = i.StartDate,
                DueDate = i.DueDate
            })
            .ToListAsync();

        return new CalendarWidgetDto { Events = events };
    }

    private static MyPageIssueDto MapToMyPageIssueDto(Issue issue)
    {
        return new MyPageIssueDto
        {
            Id = issue.Id,
            Subject = issue.Subject,
            ProjectName = issue.Project.Name,
            ProjectIdentifier = issue.Project.Identifier,
            StatusName = issue.Status.Name,
            PriorityName = issue.Priority.Name,
            AssigneeName = issue.AssignedTo != null
                ? $"{issue.AssignedTo.FirstName} {issue.AssignedTo.LastName}".Trim()
                : null,
            DueDate = issue.DueDate,
            DoneRatio = issue.DoneRatio,
            UpdatedAt = issue.UpdatedAt
        };
    }
}
