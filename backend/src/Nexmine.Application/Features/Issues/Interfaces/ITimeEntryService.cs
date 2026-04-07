using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface ITimeEntryService
{
    Task<PagedResult<TimeEntryDto>> ListAsync(TimeEntryFilterParams filterParams);
    Task<TimeEntryDto?> GetByIdAsync(int id);
    Task<TimeEntryDto> CreateAsync(CreateTimeEntryRequest request, int userId);
    Task<TimeEntryDto?> UpdateAsync(int id, UpdateTimeEntryRequest request);
    Task<bool> DeleteAsync(int id);
}
