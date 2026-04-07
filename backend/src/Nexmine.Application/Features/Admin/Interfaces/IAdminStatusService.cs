using Nexmine.Application.Features.Admin.Dtos;

namespace Nexmine.Application.Features.Admin.Interfaces;

public interface IAdminStatusService
{
    Task<List<AdminStatusDto>> ListAsync();
    Task<AdminStatusDto> CreateAsync(CreateStatusRequest request);
    Task<AdminStatusDto?> UpdateAsync(int id, UpdateStatusRequest request);
    Task<bool> DeleteAsync(int id);
}
