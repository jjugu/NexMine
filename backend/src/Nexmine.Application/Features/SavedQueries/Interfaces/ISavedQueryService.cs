using Nexmine.Application.Features.SavedQueries.Dtos;

namespace Nexmine.Application.Features.SavedQueries.Interfaces;

public interface ISavedQueryService
{
    Task<List<SavedQueryDto>> ListAsync(int userId, int? projectId = null);
    Task<SavedQueryDto?> GetByIdAsync(int id);
    Task<SavedQueryDto> CreateAsync(CreateSavedQueryRequest request, int userId);
    Task<SavedQueryDto?> UpdateAsync(int id, UpdateSavedQueryRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
