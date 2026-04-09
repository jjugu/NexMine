using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Groups.Dtos;
using Nexmine.Application.Features.Groups.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class UserGroupService : IUserGroupService
{
    private readonly NexmineDbContext _dbContext;

    public UserGroupService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<UserGroupDto>> ListAsync()
    {
        var groups = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Admin)
            .OrderBy(g => g.Name)
            .ToListAsync();

        return groups.Select(MapToDto).ToList();
    }

    public async Task<UserGroupDto?> GetByIdAsync(int id)
    {
        var group = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Admin)
            .FirstOrDefaultAsync(g => g.Id == id);

        return group is null ? null : MapToDto(group);
    }

    public async Task<UserGroupDto> CreateAsync(CreateUserGroupRequest request)
    {
        var exists = await _dbContext.UserGroups.AnyAsync(g => g.Name == request.Name);
        if (exists)
            throw new InvalidOperationException("동일한 이름의 그룹이 이미 존재합니다.");

        var group = new UserGroup
        {
            Name = request.Name,
            Description = request.Description,
            AdminUserId = request.AdminUserId
        };

        _dbContext.UserGroups.Add(group);
        await _dbContext.SaveChangesAsync();

        if (request.MemberUserIds.Length > 0)
        {
            var validUserIds = await _dbContext.Users
                .Where(u => request.MemberUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var userId in validUserIds)
            {
                _dbContext.UserGroupMembers.Add(new UserGroupMember
                {
                    GroupId = group.Id,
                    UserId = userId
                });
            }

            await _dbContext.SaveChangesAsync();
        }

        var created = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Admin)
            .FirstAsync(g => g.Id == group.Id);

        return MapToDto(created);
    }

    public async Task<UserGroupDto?> UpdateAsync(int id, UpdateUserGroupRequest request)
    {
        var group = await _dbContext.UserGroups
            .FirstOrDefaultAsync(g => g.Id == id);

        if (group is null)
            return null;

        if (request.Name is not null)
        {
            var exists = await _dbContext.UserGroups
                .AnyAsync(g => g.Name == request.Name && g.Id != id);
            if (exists)
                throw new InvalidOperationException("동일한 이름의 그룹이 이미 존재합니다.");

            group.Name = request.Name;
        }

        if (request.Description is not null)
            group.Description = request.Description;

        if (request.AdminUserId is not null)
            group.AdminUserId = request.AdminUserId.Value == 0 ? null : request.AdminUserId;

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Admin)
            .FirstAsync(g => g.Id == group.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var group = await _dbContext.UserGroups.FindAsync(id);
        if (group is null)
            return false;

        _dbContext.UserGroups.Remove(group);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task AddMembersAsync(int groupId, int[] userIds)
    {
        var group = await _dbContext.UserGroups.FindAsync(groupId)
            ?? throw new KeyNotFoundException("그룹을 찾을 수 없습니다.");

        var existingMemberIds = await _dbContext.UserGroupMembers
            .Where(m => m.GroupId == groupId)
            .Select(m => m.UserId)
            .ToListAsync();

        var validUserIds = await _dbContext.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        var newUserIds = validUserIds.Except(existingMemberIds).ToList();

        foreach (var userId in newUserIds)
        {
            _dbContext.UserGroupMembers.Add(new UserGroupMember
            {
                GroupId = groupId,
                UserId = userId
            });
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(int groupId, int userId)
    {
        var member = await _dbContext.UserGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId)
            ?? throw new KeyNotFoundException("해당 멤버를 찾을 수 없습니다.");

        _dbContext.UserGroupMembers.Remove(member);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<GroupDashboardDto?> GetDashboardAsync(int groupId, int userId, DateOnly? from, DateOnly? to)
    {
        var group = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group is null)
            return null;

        // Access control: only group admin or system admin
        var requestingUser = await _dbContext.Users.FindAsync(userId);
        if (requestingUser is null)
            return null;

        if (!requestingUser.IsAdmin && group.AdminUserId != userId)
            throw new UnauthorizedAccessException("이 그룹의 대시보드에 접근할 권한이 없습니다.");

        var memberUserIds = group.Members.Select(m => m.UserId).ToList();

        // Default date range: last 3 months
        var toDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = from ?? toDate.AddMonths(-3);

        var fromDateTime = fromDate.ToDateTime(TimeOnly.MinValue);
        var toDateTime = toDate.ToDateTime(TimeOnly.MaxValue);

        // Closed status IDs
        var closedStatusIds = await _dbContext.IssueStatuses
            .Where(s => s.IsClosed)
            .Select(s => s.Id)
            .ToListAsync();

        // Issues assigned to group members within date range
        var memberIssues = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Where(i => i.AssignedToId != null && memberUserIds.Contains(i.AssignedToId.Value))
            .Where(i => i.CreatedAt >= fromDateTime && i.CreatedAt <= toDateTime)
            .ToListAsync();

        // Member stats
        var memberStats = new List<MemberStatsDto>();
        foreach (var member in group.Members)
        {
            var userIssues = memberIssues.Where(i => i.AssignedToId == member.UserId).ToList();
            var hours = await _dbContext.TimeEntries
                .Where(t => t.UserId == member.UserId && t.SpentOn >= fromDate && t.SpentOn <= toDate)
                .SumAsync(t => t.Hours);

            memberStats.Add(new MemberStatsDto
            {
                UserId = member.UserId,
                UserName = member.User.Username,
                ClosedIssueCount = userIssues.Count(i => closedStatusIds.Contains(i.StatusId)),
                OpenIssueCount = userIssues.Count(i => !closedStatusIds.Contains(i.StatusId)),
                TotalHours = hours
            });
        }

        // Monthly trend
        var monthlyTrend = new List<MonthlyTrendDto>();
        var current = new DateOnly(fromDate.Year, fromDate.Month, 1);
        var endMonth = new DateOnly(toDate.Year, toDate.Month, 1);
        while (current <= endMonth)
        {
            var monthStart = current.ToDateTime(TimeOnly.MinValue);
            var monthEnd = current.AddMonths(1).ToDateTime(TimeOnly.MinValue);

            var closedInMonth = memberIssues.Count(i =>
                closedStatusIds.Contains(i.StatusId) &&
                i.UpdatedAt >= monthStart && i.UpdatedAt < monthEnd);

            var createdInMonth = memberIssues.Count(i =>
                i.CreatedAt >= monthStart && i.CreatedAt < monthEnd);

            monthlyTrend.Add(new MonthlyTrendDto
            {
                Month = current.ToString("yyyy-MM"),
                ClosedCount = closedInMonth,
                CreatedCount = createdInMonth
            });

            current = current.AddMonths(1);
        }

        // Tracker distribution
        var trackerDistribution = memberIssues
            .GroupBy(i => i.Tracker.Name)
            .Select(g => new TrackerDistributionDto
            {
                TrackerName = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(t => t.Count)
            .ToList();

        // Total hours
        var totalHours = await _dbContext.TimeEntries
            .Where(t => memberUserIds.Contains(t.UserId) && t.SpentOn >= fromDate && t.SpentOn <= toDate)
            .SumAsync(t => t.Hours);

        return new GroupDashboardDto
        {
            GroupId = group.Id,
            GroupName = group.Name,
            MemberStats = memberStats,
            MonthlyTrend = monthlyTrend,
            TrackerDistribution = trackerDistribution,
            Summary = new GroupSummaryDto
            {
                TotalMembers = memberUserIds.Count,
                TotalClosedIssues = memberIssues.Count(i => closedStatusIds.Contains(i.StatusId)),
                TotalOpenIssues = memberIssues.Count(i => !closedStatusIds.Contains(i.StatusId)),
                TotalHours = totalHours
            }
        };
    }

    private static UserGroupDto MapToDto(UserGroup group)
    {
        return new UserGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            AdminUserId = group.AdminUserId,
            AdminUserName = group.Admin?.Username,
            MemberCount = group.Members.Count,
            Members = group.Members.Select(m => new GroupMemberDto
            {
                UserId = m.UserId,
                UserName = m.User.Username,
                Email = m.User.Email
            }).ToList()
        };
    }
}
