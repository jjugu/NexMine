using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Interfaces;

public interface IAdminTrackerService
{
    Task<List<AdminTrackerDto>> ListAsync();
    Task<AdminTrackerDto> CreateAsync(CreateTrackerRequest request);
    Task<AdminTrackerDto?> UpdateAsync(int id, UpdateTrackerRequest request);
    Task<bool> DeleteAsync(int id);
}
