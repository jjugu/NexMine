using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Interfaces;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserDto>> ListAsync(string? search, int page, int pageSize);
    Task<AdminUserDto?> GetByIdAsync(int id);
    Task<AdminUserDto> CreateAsync(CreateUserRequest request);
    Task<AdminUserDto?> UpdateAsync(int id, UpdateUserRequest request);
    Task<bool> DeactivateAsync(int id);
}
