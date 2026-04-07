using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Interfaces;

public interface IAdminRoleService
{
    Task<List<AdminRoleDto>> ListAsync();
    Task<AdminRoleDto> CreateAsync(CreateRoleRequest request);
    Task<AdminRoleDto?> UpdateAsync(int id, UpdateRoleRequest request);
    Task<bool> DeleteAsync(int id);
}
