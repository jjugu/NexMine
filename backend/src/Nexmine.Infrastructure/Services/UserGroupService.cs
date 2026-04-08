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
            .OrderBy(g => g.Name)
            .ToListAsync();

        return groups.Select(MapToDto).ToList();
    }

    public async Task<UserGroupDto?> GetByIdAsync(int id)
    {
        var group = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
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
            Description = request.Description
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

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.UserGroups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
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

    private static UserGroupDto MapToDto(UserGroup group)
    {
        return new UserGroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
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
