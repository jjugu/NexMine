using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Workflows.Dtos;
using Nexmine.Application.Features.Workflows.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class WorkflowService : IWorkflowService
{
    private readonly NexmineDbContext _dbContext;

    public WorkflowService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<WorkflowTransitionDto>> GetTransitionsAsync(int roleId, int trackerId)
    {
        return await _dbContext.WorkflowTransitions
            .Where(wt => wt.RoleId == roleId && wt.TrackerId == trackerId)
            .Select(wt => new WorkflowTransitionDto
            {
                RoleId = wt.RoleId,
                TrackerId = wt.TrackerId,
                OldStatusId = wt.OldStatusId,
                NewStatusId = wt.NewStatusId
            })
            .ToListAsync();
    }

    public async Task UpdateTransitionsAsync(UpdateWorkflowRequest request)
    {
        // Remove all existing transitions for this role+tracker
        var existing = await _dbContext.WorkflowTransitions
            .Where(wt => wt.RoleId == request.RoleId && wt.TrackerId == request.TrackerId)
            .ToListAsync();

        _dbContext.WorkflowTransitions.RemoveRange(existing);

        // Insert new transitions
        var newTransitions = request.Transitions.Select(t => new WorkflowTransition
        {
            RoleId = request.RoleId,
            TrackerId = request.TrackerId,
            OldStatusId = t.OldStatusId,
            NewStatusId = t.NewStatusId
        }).ToList();

        _dbContext.WorkflowTransitions.AddRange(newTransitions);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<AllowedStatusDto>> GetAllowedStatusesAsync(int issueId, int userId)
    {
        var issue = await _dbContext.Issues
            .Include(i => i.Status)
            .FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("사용자를 찾을 수 없습니다.");

        // Admin users can transition to any status
        if (user.IsAdmin)
        {
            return await GetAllStatusesAsync(issue.StatusId);
        }

        // Find user's role in the issue's project
        var membership = await _dbContext.ProjectMemberships
            .FirstOrDefaultAsync(pm => pm.ProjectId == issue.ProjectId && pm.UserId == userId);

        if (membership is null)
        {
            // User is not a member of the project, only allow current status
            return await GetCurrentStatusOnlyAsync(issue.StatusId);
        }

        var roleId = membership.RoleId;

        // Check if any workflow rules exist for this role+tracker combination
        var hasRules = await _dbContext.WorkflowTransitions
            .AnyAsync(wt => wt.RoleId == roleId && wt.TrackerId == issue.TrackerId);

        if (!hasRules)
        {
            // No workflow rules defined: allow all statuses (default behavior)
            return await GetAllStatusesAsync(issue.StatusId);
        }

        // Get allowed new statuses from workflow transitions
        var allowedStatusIds = await _dbContext.WorkflowTransitions
            .Where(wt => wt.RoleId == roleId
                && wt.TrackerId == issue.TrackerId
                && wt.OldStatusId == issue.StatusId)
            .Select(wt => wt.NewStatusId)
            .ToListAsync();

        // Include current status (user may choose not to change)
        if (!allowedStatusIds.Contains(issue.StatusId))
        {
            allowedStatusIds.Add(issue.StatusId);
        }

        return await _dbContext.IssueStatuses
            .Where(s => allowedStatusIds.Contains(s.Id))
            .OrderBy(s => s.Position)
            .Select(s => new AllowedStatusDto
            {
                Id = s.Id,
                Name = s.Name,
                IsClosed = s.IsClosed
            })
            .ToListAsync();
    }

    public async Task<bool> CanTransitionAsync(int roleId, int trackerId, int oldStatusId, int newStatusId)
    {
        // Same status is always allowed
        if (oldStatusId == newStatusId)
            return true;

        // Check if any workflow rules exist for this role+tracker
        var hasRules = await _dbContext.WorkflowTransitions
            .AnyAsync(wt => wt.RoleId == roleId && wt.TrackerId == trackerId);

        if (!hasRules)
        {
            // No rules defined: all transitions allowed
            return true;
        }

        return await _dbContext.WorkflowTransitions
            .AnyAsync(wt => wt.RoleId == roleId
                && wt.TrackerId == trackerId
                && wt.OldStatusId == oldStatusId
                && wt.NewStatusId == newStatusId);
    }

    private async Task<List<AllowedStatusDto>> GetAllStatusesAsync(int currentStatusId)
    {
        return await _dbContext.IssueStatuses
            .OrderBy(s => s.Position)
            .Select(s => new AllowedStatusDto
            {
                Id = s.Id,
                Name = s.Name,
                IsClosed = s.IsClosed
            })
            .ToListAsync();
    }

    private async Task<List<AllowedStatusDto>> GetCurrentStatusOnlyAsync(int statusId)
    {
        var status = await _dbContext.IssueStatuses.FindAsync(statusId);
        if (status is null)
            return [];

        return
        [
            new AllowedStatusDto
            {
                Id = status.Id,
                Name = status.Name,
                IsClosed = status.IsClosed
            }
        ];
    }
}
