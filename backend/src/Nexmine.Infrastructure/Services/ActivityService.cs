using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Activities.Dtos;
using Nexmine.Application.Features.Activities.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ActivityService : IActivityService
{
    private readonly NexmineDbContext _dbContext;
    private const int MaxDaysBack = 30;
    private const int MaxPerSource = 100;
    private const int DescriptionMaxLength = 200;

    public ActivityService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<ActivityDto>> GetGlobalActivityAsync(int userId, ActivityFilterParams filter)
    {
        var projectIds = await _dbContext.ProjectMemberships
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync();

        if (projectIds.Count == 0)
        {
            return new PagedResult<ActivityDto>
            {
                Items = [],
                TotalCount = 0,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        var activities = await CollectActivitiesAsync(projectIds, filter);
        return Paginate(activities, filter);
    }

    public async Task<PagedResult<ActivityDto>> GetProjectActivityAsync(string projectIdentifier, ActivityFilterParams filter)
    {
        var project = await _dbContext.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier && !p.IsArchived);

        if (project is null)
        {
            return new PagedResult<ActivityDto>
            {
                Items = [],
                TotalCount = 0,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        var projectIds = new List<int> { project.Id };
        var activities = await CollectActivitiesAsync(projectIds, filter);
        return Paginate(activities, filter);
    }

    private async Task<List<ActivityDto>> CollectActivitiesAsync(List<int> projectIds, ActivityFilterParams filter)
    {
        var since = DateTime.UtcNow.AddDays(-MaxDaysBack);
        var all = new List<ActivityDto>();

        if (filter.Type is null or "issue")
        {
            var issueActivities = await GetIssueCreatedActivitiesAsync(projectIds, since, filter.UserId);
            all.AddRange(issueActivities);

            var journalActivities = await GetIssueUpdatedActivitiesAsync(projectIds, since, filter.UserId);
            all.AddRange(journalActivities);
        }

        if (filter.Type is null or "wiki")
        {
            var wikiActivities = await GetWikiEditedActivitiesAsync(projectIds, since, filter.UserId);
            all.AddRange(wikiActivities);
        }

        if (filter.Type is null or "document")
        {
            var documentActivities = await GetDocumentCreatedActivitiesAsync(projectIds, since, filter.UserId);
            all.AddRange(documentActivities);
        }

        all.Sort((a, b) => b.CreatedAt.CompareTo(a.CreatedAt));
        return all;
    }

    private async Task<List<ActivityDto>> GetIssueCreatedActivitiesAsync(
        List<int> projectIds, DateTime since, int? filterUserId)
    {
        var query = _dbContext.Issues
            .AsNoTracking()
            .Include(i => i.Project)
            .Include(i => i.Author)
            .Where(i => projectIds.Contains(i.ProjectId) && i.CreatedAt >= since);

        if (filterUserId.HasValue)
        {
            query = query.Where(i => i.AuthorId == filterUserId.Value);
        }

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(MaxPerSource)
            .Select(i => new ActivityDto
            {
                Type = "issue_created",
                Title = "#" + i.Id + " " + i.Subject,
                ProjectId = i.ProjectId,
                ProjectName = i.Project.Name,
                ProjectIdentifier = i.Project.Identifier,
                UserId = i.AuthorId,
                UserName = i.Author.Username,
                CreatedAt = i.CreatedAt,
                IssueId = i.Id,
                IssueSubject = i.Subject
            })
            .ToListAsync();
    }

    private async Task<List<ActivityDto>> GetIssueUpdatedActivitiesAsync(
        List<int> projectIds, DateTime since, int? filterUserId)
    {
        var query = _dbContext.Journals
            .AsNoTracking()
            .Include(j => j.Issue).ThenInclude(i => i.Project)
            .Include(j => j.User)
            .Where(j => projectIds.Contains(j.Issue.ProjectId) && j.CreatedAt >= since);

        if (filterUserId.HasValue)
        {
            query = query.Where(j => j.UserId == filterUserId.Value);
        }

        return await query
            .OrderByDescending(j => j.CreatedAt)
            .Take(MaxPerSource)
            .Select(j => new ActivityDto
            {
                Type = "issue_updated",
                Title = "#" + j.Issue.Id + " " + j.Issue.Subject,
                Description = j.Notes != null
                    ? (j.Notes.Length > DescriptionMaxLength
                        ? j.Notes.Substring(0, DescriptionMaxLength) + "..."
                        : j.Notes)
                    : null,
                ProjectId = j.Issue.ProjectId,
                ProjectName = j.Issue.Project.Name,
                ProjectIdentifier = j.Issue.Project.Identifier,
                UserId = j.UserId,
                UserName = j.User.Username,
                CreatedAt = j.CreatedAt,
                IssueId = j.Issue.Id,
                IssueSubject = j.Issue.Subject
            })
            .ToListAsync();
    }

    private async Task<List<ActivityDto>> GetWikiEditedActivitiesAsync(
        List<int> projectIds, DateTime since, int? filterUserId)
    {
        var query = _dbContext.WikiPageVersions
            .AsNoTracking()
            .Include(v => v.WikiPage).ThenInclude(wp => wp.Project)
            .Include(v => v.EditedBy)
            .Where(v => projectIds.Contains(v.WikiPage.ProjectId) && v.CreatedAt >= since);

        if (filterUserId.HasValue)
        {
            query = query.Where(v => v.EditedByUserId == filterUserId.Value);
        }

        return await query
            .OrderByDescending(v => v.CreatedAt)
            .Take(MaxPerSource)
            .Select(v => new ActivityDto
            {
                Type = "wiki_edited",
                Title = v.WikiPage.Title,
                ProjectId = v.WikiPage.ProjectId,
                ProjectName = v.WikiPage.Project.Name,
                ProjectIdentifier = v.WikiPage.Project.Identifier,
                UserId = v.EditedByUserId,
                UserName = v.EditedBy.Username,
                CreatedAt = v.CreatedAt,
                WikiSlug = v.WikiPage.Slug,
                WikiTitle = v.WikiPage.Title
            })
            .ToListAsync();
    }

    private async Task<List<ActivityDto>> GetDocumentCreatedActivitiesAsync(
        List<int> projectIds, DateTime since, int? filterUserId)
    {
        var query = _dbContext.Documents
            .AsNoTracking()
            .Include(d => d.Project)
            .Include(d => d.Author)
            .Where(d => projectIds.Contains(d.ProjectId) && d.CreatedAt >= since);

        if (filterUserId.HasValue)
        {
            query = query.Where(d => d.AuthorId == filterUserId.Value);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Take(MaxPerSource)
            .Select(d => new ActivityDto
            {
                Type = "document_created",
                Title = d.Title,
                ProjectId = d.ProjectId,
                ProjectName = d.Project.Name,
                ProjectIdentifier = d.Project.Identifier,
                UserId = d.AuthorId,
                UserName = d.Author.Username,
                CreatedAt = d.CreatedAt,
                DocumentId = d.Id,
                DocumentTitle = d.Title
            })
            .ToListAsync();
    }

    private static PagedResult<ActivityDto> Paginate(List<ActivityDto> activities, ActivityFilterParams filter)
    {
        var totalCount = activities.Count;
        var items = activities
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        return new PagedResult<ActivityDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }
}
