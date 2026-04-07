using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class GanttService : IGanttService
{
    private readonly NexmineDbContext _dbContext;

    public GanttService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<GanttIssueDto>> GetGanttIssuesAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var issues = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Priority)
            .Include(i => i.Status)
            .Include(i => i.AssignedTo)
            .Include(i => i.RelationsFrom)
            .Include(i => i.RelationsTo)
            .Where(i => i.ProjectId == project.Id)
            .Where(i => i.StartDate != null || i.DueDate != null)
            .OrderBy(i => i.StartDate ?? i.DueDate)
            .ThenBy(i => i.Id)
            .ToListAsync();

        return issues.Select(i => new GanttIssueDto
        {
            Id = i.Id,
            Subject = i.Subject,
            TrackerName = i.Tracker.Name,
            PriorityName = i.Priority.Name,
            AssignedToName = i.AssignedTo != null
                ? $"{i.AssignedTo.FirstName} {i.AssignedTo.LastName}".Trim()
                : null,
            StatusName = i.Status.Name,
            ParentIssueId = i.ParentIssueId,
            StartDate = i.StartDate,
            DueDate = i.DueDate,
            DoneRatio = i.DoneRatio,
            Relations = i.RelationsFrom
                .Select(r => new GanttRelationDto
                {
                    IssueFromId = r.IssueFromId,
                    IssueToId = r.IssueToId,
                    RelationType = (int)r.RelationType,
                    Delay = r.Delay
                }).ToList()
        }).ToList();
    }
}
