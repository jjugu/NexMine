using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.CustomFields.Dtos;
using Nexmine.Application.Features.CustomFields.Interfaces;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Application.Features.Watchers.Interfaces;
using Nexmine.Application.Features.Workflows.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class IssueService : IIssueService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ICustomFieldService _customFieldService;
    private readonly IWorkflowService _workflowService;
    private readonly IWatcherService _watcherService;

    private static readonly string[] TrackedFields =
    [
        nameof(Issue.Subject),
        nameof(Issue.Description),
        nameof(Issue.StatusId),
        nameof(Issue.TrackerId),
        nameof(Issue.PriorityId),
        nameof(Issue.AssignedToId),
        nameof(Issue.CategoryId),
        nameof(Issue.VersionId),
        nameof(Issue.StartDate),
        nameof(Issue.DueDate),
        nameof(Issue.DoneRatio),
        nameof(Issue.EstimatedHours),
        nameof(Issue.IsPrivate)
    ];

    public IssueService(NexmineDbContext dbContext, IMapper mapper, ICustomFieldService customFieldService, IWorkflowService workflowService, IWatcherService watcherService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _customFieldService = customFieldService;
        _workflowService = workflowService;
        _watcherService = watcherService;
    }

    public async Task<PagedResult<IssueDto>> ListAsync(string projectIdentifier, IssueFilterParams filterParams)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var query = _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.ProjectId == project.Id)
            .AsQueryable();

        if (filterParams.TrackerId.HasValue)
            query = query.Where(i => i.TrackerId == filterParams.TrackerId.Value);

        if (filterParams.StatusId.HasValue)
            query = query.Where(i => i.StatusId == filterParams.StatusId.Value);

        if (filterParams.PriorityId.HasValue)
            query = query.Where(i => i.PriorityId == filterParams.PriorityId.Value);

        if (filterParams.CategoryId.HasValue)
            query = query.Where(i => i.CategoryId == filterParams.CategoryId.Value);

        if (filterParams.VersionId.HasValue)
            query = query.Where(i => i.VersionId == filterParams.VersionId.Value);

        if (filterParams.AssignedToId.HasValue)
            query = query.Where(i => i.AssignedToId == filterParams.AssignedToId.Value);

        if (filterParams.AuthorId.HasValue)
            query = query.Where(i => i.AuthorId == filterParams.AuthorId.Value);

        if (filterParams.ParentIssueId.HasValue)
            query = query.Where(i => i.ParentIssueId == filterParams.ParentIssueId.Value);

        if (filterParams.IsPrivate.HasValue)
            query = query.Where(i => i.IsPrivate == filterParams.IsPrivate.Value);

        if (filterParams.IsClosed.HasValue)
            query = query.Where(i => i.Status.IsClosed == filterParams.IsClosed.Value);

        if (!string.IsNullOrWhiteSpace(filterParams.Search))
        {
            var term = filterParams.Search.ToLower();
            query = query.Where(i => i.Subject.ToLower().Contains(term));
        }

        query = filterParams.SortBy?.ToLower() switch
        {
            "subject" => filterParams.SortDesc ? query.OrderByDescending(i => i.Subject) : query.OrderBy(i => i.Subject),
            "status" => filterParams.SortDesc ? query.OrderByDescending(i => i.Status.Position) : query.OrderBy(i => i.Status.Position),
            "priority" => filterParams.SortDesc ? query.OrderByDescending(i => i.Priority.Position) : query.OrderBy(i => i.Priority.Position),
            "tracker" => filterParams.SortDesc ? query.OrderByDescending(i => i.Tracker.Position) : query.OrderBy(i => i.Tracker.Position),
            "assignee" => filterParams.SortDesc ? query.OrderByDescending(i => i.AssignedTo!.Username) : query.OrderBy(i => i.AssignedTo!.Username),
            "updated" => filterParams.SortDesc ? query.OrderByDescending(i => i.UpdatedAt) : query.OrderBy(i => i.UpdatedAt),
            _ => filterParams.SortDesc ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filterParams.Page - 1) * filterParams.PageSize)
            .Take(filterParams.PageSize)
            .ToListAsync();

        var dtos = items.Select(i => new IssueDto
        {
            Id = i.Id,
            Subject = i.Subject,
            TrackerName = i.Tracker.Name,
            StatusName = i.Status.Name,
            PriorityName = i.Priority.Name,
            AssignedToName = i.AssignedTo != null
                ? $"{i.AssignedTo.FirstName} {i.AssignedTo.LastName}".Trim()
                : null,
            DoneRatio = i.DoneRatio,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt
        }).ToList();

        return new PagedResult<IssueDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = filterParams.Page,
            PageSize = filterParams.PageSize
        };
    }

    public async Task<IssueDetailDto?> GetByIdAsync(int id)
    {
        var issue = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .Include(i => i.ParentIssue)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (issue is null)
            return null;

        var dto = MapToDetailDto(issue);
        dto.CustomValues = await _customFieldService.GetValuesAsync("issue", issue.Id);
        return dto;
    }

    public async Task<IssueDetailDto> CreateAsync(string projectIdentifier, CreateIssueRequest request, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var tracker = await _dbContext.Trackers.FindAsync(request.TrackerId)
            ?? throw new KeyNotFoundException("트래커를 찾을 수 없습니다.");

        int statusId;
        if (request.StatusId.HasValue)
        {
            var status = await _dbContext.IssueStatuses.FindAsync(request.StatusId.Value)
                ?? throw new KeyNotFoundException("상태를 찾을 수 없습니다.");
            statusId = status.Id;
        }
        else
        {
            var defaultStatus = await _dbContext.IssueStatuses
                .OrderBy(s => s.Position)
                .FirstAsync();
            statusId = defaultStatus.Id;
        }

        int priorityId;
        if (request.PriorityId.HasValue)
        {
            var priority = await _dbContext.IssuePriorities.FindAsync(request.PriorityId.Value)
                ?? throw new KeyNotFoundException("우선순위를 찾을 수 없습니다.");
            priorityId = priority.Id;
        }
        else
        {
            var defaultPriority = await _dbContext.IssuePriorities
                .FirstOrDefaultAsync(p => p.IsDefault)
                ?? await _dbContext.IssuePriorities.OrderBy(p => p.Position).FirstAsync();
            priorityId = defaultPriority.Id;
        }

        // Calculate next position for kanban
        var maxPosition = await _dbContext.Issues
            .Where(i => i.ProjectId == project.Id && i.StatusId == statusId)
            .MaxAsync(i => (int?)i.Position) ?? 0;

        var issue = new Issue
        {
            ProjectId = project.Id,
            TrackerId = request.TrackerId,
            StatusId = statusId,
            PriorityId = priorityId,
            CategoryId = request.CategoryId,
            VersionId = request.VersionId,
            AuthorId = userId,
            AssignedToId = request.AssignedToId,
            ParentIssueId = request.ParentIssueId,
            Subject = request.Subject,
            Description = request.Description,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            EstimatedHours = request.EstimatedHours,
            DoneRatio = request.DoneRatio ?? 0,
            IsPrivate = request.IsPrivate,
            Position = maxPosition + 1
        };

        _dbContext.Issues.Add(issue);
        await _dbContext.SaveChangesAsync();

        // Save custom values
        if (request.CustomValues is { Count: > 0 })
        {
            await _customFieldService.SetValuesAsync("issue", issue.Id, request.CustomValues);
        }

        // Reload with navigation properties
        var created = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .Include(i => i.ParentIssue)
            .FirstAsync(i => i.Id == issue.Id);

        var createdDto = MapToDetailDto(created);
        createdDto.CustomValues = await _customFieldService.GetValuesAsync("issue", created.Id);
        return createdDto;
    }

    public async Task<IssueDetailDto?> UpdateAsync(int id, UpdateIssueRequest request, int userId)
    {
        var issue = await _dbContext.Issues
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (issue is null)
            return null;

        // Validate workflow transition if status is being changed
        if (request.StatusId.HasValue && request.StatusId.Value != issue.StatusId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user is not null && !user.IsAdmin)
            {
                var membership = await _dbContext.ProjectMemberships
                    .FirstOrDefaultAsync(pm => pm.ProjectId == issue.ProjectId && pm.UserId == userId);

                if (membership is not null)
                {
                    var canTransition = await _workflowService.CanTransitionAsync(
                        membership.RoleId, issue.TrackerId, issue.StatusId, request.StatusId.Value);

                    if (!canTransition)
                    {
                        throw new InvalidOperationException("해당 상태로의 전환이 허용되지 않습니다.");
                    }
                }
            }
        }

        // Capture old values for journal
        var oldValues = new Dictionary<string, string?>
        {
            [nameof(Issue.Subject)] = issue.Subject,
            [nameof(Issue.Description)] = issue.Description,
            [nameof(Issue.StatusId)] = issue.StatusId.ToString(),
            [nameof(Issue.TrackerId)] = issue.TrackerId.ToString(),
            [nameof(Issue.PriorityId)] = issue.PriorityId.ToString(),
            [nameof(Issue.AssignedToId)] = issue.AssignedToId?.ToString(),
            [nameof(Issue.CategoryId)] = issue.CategoryId?.ToString(),
            [nameof(Issue.VersionId)] = issue.VersionId?.ToString(),
            [nameof(Issue.StartDate)] = issue.StartDate?.ToString("yyyy-MM-dd"),
            [nameof(Issue.DueDate)] = issue.DueDate?.ToString("yyyy-MM-dd"),
            [nameof(Issue.DoneRatio)] = issue.DoneRatio.ToString(),
            [nameof(Issue.EstimatedHours)] = issue.EstimatedHours?.ToString(),
            [nameof(Issue.IsPrivate)] = issue.IsPrivate.ToString()
        };

        // Apply updates
        if (request.Subject is not null)
            issue.Subject = request.Subject;

        if (request.Description is not null)
            issue.Description = request.Description;

        if (request.TrackerId.HasValue)
            issue.TrackerId = request.TrackerId.Value;

        if (request.StatusId.HasValue)
            issue.StatusId = request.StatusId.Value;

        if (request.PriorityId.HasValue)
            issue.PriorityId = request.PriorityId.Value;

        if (request.CategoryId.HasValue)
            issue.CategoryId = request.CategoryId.Value;

        if (request.VersionId.HasValue)
            issue.VersionId = request.VersionId.Value;

        if (request.AssignedToId.HasValue)
            issue.AssignedToId = request.AssignedToId.Value;

        if (request.ParentIssueId.HasValue)
            issue.ParentIssueId = request.ParentIssueId.Value;

        if (request.StartDate.HasValue)
            issue.StartDate = request.StartDate.Value;

        if (request.DueDate.HasValue)
            issue.DueDate = request.DueDate.Value;

        if (request.EstimatedHours.HasValue)
            issue.EstimatedHours = request.EstimatedHours.Value;

        if (request.DoneRatio.HasValue)
            issue.DoneRatio = request.DoneRatio.Value;

        if (request.IsPrivate.HasValue)
            issue.IsPrivate = request.IsPrivate.Value;

        // Auto-set DoneRatio=100 when status changes to IsClosed=true
        if (request.StatusId.HasValue)
        {
            var newStatus = await _dbContext.IssueStatuses.FindAsync(request.StatusId.Value);
            if (newStatus is not null && newStatus.IsClosed)
            {
                issue.DoneRatio = 100;
            }
        }

        // Capture new values
        var newValues = new Dictionary<string, string?>
        {
            [nameof(Issue.Subject)] = issue.Subject,
            [nameof(Issue.Description)] = issue.Description,
            [nameof(Issue.StatusId)] = issue.StatusId.ToString(),
            [nameof(Issue.TrackerId)] = issue.TrackerId.ToString(),
            [nameof(Issue.PriorityId)] = issue.PriorityId.ToString(),
            [nameof(Issue.AssignedToId)] = issue.AssignedToId?.ToString(),
            [nameof(Issue.CategoryId)] = issue.CategoryId?.ToString(),
            [nameof(Issue.VersionId)] = issue.VersionId?.ToString(),
            [nameof(Issue.StartDate)] = issue.StartDate?.ToString("yyyy-MM-dd"),
            [nameof(Issue.DueDate)] = issue.DueDate?.ToString("yyyy-MM-dd"),
            [nameof(Issue.DoneRatio)] = issue.DoneRatio.ToString(),
            [nameof(Issue.EstimatedHours)] = issue.EstimatedHours?.ToString(),
            [nameof(Issue.IsPrivate)] = issue.IsPrivate.ToString()
        };

        // Generate journal details for changed fields
        var journalDetails = new List<JournalDetail>();
        foreach (var field in TrackedFields)
        {
            var oldVal = oldValues[field];
            var newVal = newValues[field];
            if (oldVal != newVal)
            {
                journalDetails.Add(new JournalDetail
                {
                    PropertyName = field,
                    OldValue = oldVal,
                    NewValue = newVal
                });
            }
        }

        // Create journal if there are changes
        if (journalDetails.Count > 0)
        {
            var journal = new Journal
            {
                IssueId = issue.Id,
                UserId = userId,
                Details = journalDetails
            };
            _dbContext.Journals.Add(journal);
        }

        await _dbContext.SaveChangesAsync();

        // Save custom values
        if (request.CustomValues is { Count: > 0 })
        {
            await _customFieldService.SetValuesAsync("issue", issue.Id, request.CustomValues);
        }

        // Reload with navigation properties
        var updated = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .Include(i => i.ParentIssue)
            .FirstAsync(i => i.Id == issue.Id);

        var updatedDto = MapToDetailDto(updated);
        updatedDto.CustomValues = await _customFieldService.GetValuesAsync("issue", updated.Id);
        return updatedDto;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var issue = await _dbContext.Issues.FindAsync(id);
        if (issue is null)
            return false;

        _dbContext.Issues.Remove(issue);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<IssueDetailDto?> UpdatePositionAsync(int id, UpdateIssuePositionRequest request, int userId)
    {
        var issue = await _dbContext.Issues
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (issue is null)
            return null;

        var journalDetails = new List<JournalDetail>();

        // If StatusId is provided and different from current → change status
        if (request.StatusId.HasValue && request.StatusId.Value != issue.StatusId)
        {
            // Validate workflow transition
            var user = await _dbContext.Users.FindAsync(userId);
            if (user is not null && !user.IsAdmin)
            {
                var membership = await _dbContext.ProjectMemberships
                    .FirstOrDefaultAsync(pm => pm.ProjectId == issue.ProjectId && pm.UserId == userId);

                if (membership is not null)
                {
                    var canTransition = await _workflowService.CanTransitionAsync(
                        membership.RoleId, issue.TrackerId, issue.StatusId, request.StatusId.Value);

                    if (!canTransition)
                    {
                        throw new InvalidOperationException("해당 상태로의 전환이 허용되지 않습니다.");
                    }
                }
            }

            var newStatus = await _dbContext.IssueStatuses.FindAsync(request.StatusId.Value)
                ?? throw new KeyNotFoundException("상태를 찾을 수 없습니다.");

            var oldStatusId = issue.StatusId.ToString();
            issue.StatusId = request.StatusId.Value;

            journalDetails.Add(new JournalDetail
            {
                PropertyName = nameof(Issue.StatusId),
                OldValue = oldStatusId,
                NewValue = issue.StatusId.ToString()
            });

            // Auto DoneRatio=100 when status changes to IsClosed=true
            if (newStatus.IsClosed)
            {
                var oldDoneRatio = issue.DoneRatio.ToString();
                issue.DoneRatio = 100;

                if (oldDoneRatio != "100")
                {
                    journalDetails.Add(new JournalDetail
                    {
                        PropertyName = nameof(Issue.DoneRatio),
                        OldValue = oldDoneRatio,
                        NewValue = "100"
                    });
                }
            }
        }

        // Update position
        issue.Position = request.Position;

        // Create journal if there are changes
        if (journalDetails.Count > 0)
        {
            var journal = new Journal
            {
                IssueId = issue.Id,
                UserId = userId,
                Details = journalDetails
            };
            _dbContext.Journals.Add(journal);
        }

        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties
        var updated = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .Include(i => i.ParentIssue)
            .FirstAsync(i => i.Id == issue.Id);

        var positionDto = MapToDetailDto(updated);
        positionDto.CustomValues = await _customFieldService.GetValuesAsync("issue", updated.Id);
        return positionDto;
    }

    public async Task<int> BulkUpdateAsync(BulkUpdateIssuesRequest request, int userId)
    {
        var issues = await _dbContext.Issues
            .Include(i => i.Status)
            .Include(i => i.Tracker)
            .Where(i => request.IssueIds.Contains(i.Id))
            .ToListAsync();

        if (issues.Count == 0)
            return 0;

        // Pre-load the new status if changing status
        IssueStatus? newStatus = null;
        if (request.StatusId.HasValue)
        {
            newStatus = await _dbContext.IssueStatuses.FindAsync(request.StatusId.Value)
                ?? throw new KeyNotFoundException("상태를 찾을 수 없습니다.");
        }

        foreach (var issue in issues)
        {
            var journalDetails = new List<JournalDetail>();

            if (request.StatusId.HasValue && request.StatusId.Value != issue.StatusId)
            {
                journalDetails.Add(new JournalDetail
                {
                    PropertyName = nameof(Issue.StatusId),
                    OldValue = issue.StatusId.ToString(),
                    NewValue = request.StatusId.Value.ToString()
                });
                issue.StatusId = request.StatusId.Value;

                // Auto-set DoneRatio=100 when status changes to IsClosed=true
                if (newStatus is not null && newStatus.IsClosed && issue.DoneRatio != 100)
                {
                    journalDetails.Add(new JournalDetail
                    {
                        PropertyName = nameof(Issue.DoneRatio),
                        OldValue = issue.DoneRatio.ToString(),
                        NewValue = "100"
                    });
                    issue.DoneRatio = 100;
                }
            }

            if (request.PriorityId.HasValue && request.PriorityId.Value != issue.PriorityId)
            {
                journalDetails.Add(new JournalDetail
                {
                    PropertyName = nameof(Issue.PriorityId),
                    OldValue = issue.PriorityId.ToString(),
                    NewValue = request.PriorityId.Value.ToString()
                });
                issue.PriorityId = request.PriorityId.Value;
            }

            if (request.TrackerId.HasValue && request.TrackerId.Value != issue.TrackerId)
            {
                journalDetails.Add(new JournalDetail
                {
                    PropertyName = nameof(Issue.TrackerId),
                    OldValue = issue.TrackerId.ToString(),
                    NewValue = request.TrackerId.Value.ToString()
                });
                issue.TrackerId = request.TrackerId.Value;
            }

            if (request.AssignedToId.HasValue)
            {
                // 0 means unassign
                int? newAssignedToId = request.AssignedToId.Value == 0 ? null : request.AssignedToId.Value;
                if (newAssignedToId != issue.AssignedToId)
                {
                    journalDetails.Add(new JournalDetail
                    {
                        PropertyName = nameof(Issue.AssignedToId),
                        OldValue = issue.AssignedToId?.ToString(),
                        NewValue = newAssignedToId?.ToString()
                    });
                    issue.AssignedToId = newAssignedToId;
                }
            }

            if (request.VersionId.HasValue)
            {
                // 0 means remove version
                int? newVersionId = request.VersionId.Value == 0 ? null : request.VersionId.Value;
                if (newVersionId != issue.VersionId)
                {
                    journalDetails.Add(new JournalDetail
                    {
                        PropertyName = nameof(Issue.VersionId),
                        OldValue = issue.VersionId?.ToString(),
                        NewValue = newVersionId?.ToString()
                    });
                    issue.VersionId = newVersionId;
                }
            }

            if (request.CategoryId.HasValue)
            {
                // 0 means remove category
                int? newCategoryId = request.CategoryId.Value == 0 ? null : request.CategoryId.Value;
                if (newCategoryId != issue.CategoryId)
                {
                    journalDetails.Add(new JournalDetail
                    {
                        PropertyName = nameof(Issue.CategoryId),
                        OldValue = issue.CategoryId?.ToString(),
                        NewValue = newCategoryId?.ToString()
                    });
                    issue.CategoryId = newCategoryId;
                }
            }

            // Create journal if there are changes
            if (journalDetails.Count > 0)
            {
                var journal = new Journal
                {
                    IssueId = issue.Id,
                    UserId = userId,
                    Notes = "일괄 수정",
                    Details = journalDetails
                };
                _dbContext.Journals.Add(journal);
            }
        }

        await _dbContext.SaveChangesAsync();
        return issues.Count;
    }

    public async Task<IssueDetailDto> CopyIssueAsync(int issueId, CopyIssueRequest request, int userId)
    {
        var source = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var targetProjectId = request.TargetProjectId > 0 ? request.TargetProjectId : source.ProjectId;
        var isSameProject = targetProjectId == source.ProjectId;

        // Validate target project exists if different
        if (!isSameProject)
        {
            var targetProject = await _dbContext.Projects.FindAsync(targetProjectId)
                ?? throw new KeyNotFoundException("대상 프로젝트를 찾을 수 없습니다.");
        }

        // Get default status (New)
        var defaultStatus = await _dbContext.IssueStatuses
            .OrderBy(s => s.Position)
            .FirstAsync();

        // Calculate next position for kanban
        var maxPosition = await _dbContext.Issues
            .Where(i => i.ProjectId == targetProjectId && i.StatusId == defaultStatus.Id)
            .MaxAsync(i => (int?)i.Position) ?? 0;

        var copy = new Issue
        {
            ProjectId = targetProjectId,
            TrackerId = source.TrackerId,
            StatusId = defaultStatus.Id,
            PriorityId = source.PriorityId,
            CategoryId = isSameProject ? source.CategoryId : null,
            VersionId = isSameProject ? source.VersionId : null,
            AuthorId = userId,
            AssignedToId = isSameProject ? source.AssignedToId : null,
            Subject = $"복사: {source.Subject}",
            Description = request.CopyDescription ? source.Description : null,
            StartDate = source.StartDate,
            DueDate = source.DueDate,
            EstimatedHours = source.EstimatedHours,
            DoneRatio = 0,
            IsPrivate = source.IsPrivate,
            Position = maxPosition + 1
        };

        _dbContext.Issues.Add(copy);
        await _dbContext.SaveChangesAsync();

        // Copy watchers if requested
        if (request.CopyWatchers)
        {
            var sourceWatchers = await _dbContext.Watchers
                .Where(w => w.WatchableType == "issue" && w.WatchableId == issueId)
                .ToListAsync();

            foreach (var watcher in sourceWatchers)
            {
                await _watcherService.AddWatcherAsync("issue", copy.Id, watcher.UserId);
            }
        }

        // Reload with navigation properties
        var created = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.Category)
            .Include(i => i.Version)
            .Include(i => i.Author)
            .Include(i => i.AssignedTo)
            .Include(i => i.ParentIssue)
            .FirstAsync(i => i.Id == copy.Id);

        var createdDto = MapToDetailDto(created);
        createdDto.CustomValues = await _customFieldService.GetValuesAsync("issue", created.Id);
        return createdDto;
    }

    private static IssueDetailDto MapToDetailDto(Issue issue)
    {
        return new IssueDetailDto
        {
            Id = issue.Id,
            ProjectId = issue.ProjectId,
            TrackerId = issue.TrackerId,
            TrackerName = issue.Tracker.Name,
            StatusId = issue.StatusId,
            StatusName = issue.Status.Name,
            PriorityId = issue.PriorityId,
            PriorityName = issue.Priority.Name,
            CategoryId = issue.CategoryId,
            CategoryName = issue.Category?.Name,
            VersionId = issue.VersionId,
            VersionName = issue.Version?.Name,
            AuthorId = issue.AuthorId,
            AuthorName = $"{issue.Author.FirstName} {issue.Author.LastName}".Trim(),
            AssignedToId = issue.AssignedToId,
            AssignedToName = issue.AssignedTo != null
                ? $"{issue.AssignedTo.FirstName} {issue.AssignedTo.LastName}".Trim()
                : null,
            ParentIssueId = issue.ParentIssueId,
            ParentIssueSubject = issue.ParentIssue?.Subject,
            Subject = issue.Subject,
            Description = issue.Description,
            StartDate = issue.StartDate,
            DueDate = issue.DueDate,
            EstimatedHours = issue.EstimatedHours,
            DoneRatio = issue.DoneRatio,
            IsPrivate = issue.IsPrivate,
            Position = issue.Position,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt
        };
    }
}
