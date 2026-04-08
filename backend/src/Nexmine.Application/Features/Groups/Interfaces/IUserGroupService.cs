using Nexmine.Application.Features.Groups.Dtos;

namespace Nexmine.Application.Features.Groups.Interfaces;

public interface IUserGroupService
{
    Task<List<UserGroupDto>> ListAsync();
    Task<UserGroupDto?> GetByIdAsync(int id);
    Task<UserGroupDto> CreateAsync(CreateUserGroupRequest request);
    Task<UserGroupDto?> UpdateAsync(int id, UpdateUserGroupRequest request);
    Task<bool> DeleteAsync(int id);
    Task AddMembersAsync(int groupId, int[] userIds);
    Task RemoveMemberAsync(int groupId, int userId);
}
