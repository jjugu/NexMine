using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Interfaces;

public interface IAdminPriorityService
{
    Task<List<AdminPriorityDto>> ListAsync();
    Task<AdminPriorityDto> CreateAsync(CreatePriorityRequest request);
    Task<AdminPriorityDto?> UpdateAsync(int id, UpdatePriorityRequest request);
    Task<bool> DeleteAsync(int id);
}
