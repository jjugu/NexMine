using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Interfaces;

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> ListAsync(int page, int pageSize, string? search, int? userId = null);
    Task<ProjectDto?> GetByIdentifierAsync(string identifier, int? userId = null);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId);
    Task<ProjectDto?> UpdateAsync(string identifier, UpdateProjectRequest request);
    Task<bool> ArchiveAsync(string identifier);
    Task<ProjectModulesDto> GetModulesAsync(string projectIdentifier);
    Task UpdateModulesAsync(string projectIdentifier, UpdateProjectModulesRequest request);
    Task<bool> IsModuleEnabledAsync(string projectIdentifier, string moduleName);
    Task<ProjectDto> CopyProjectAsync(string sourceIdentifier, CopyProjectRequest request, int userId);
    Task<bool> AddFavoriteAsync(string identifier, int userId);
    Task<bool> RemoveFavoriteAsync(string identifier, int userId);
    Task<List<ProjectDto>> GetFavoritesAsync(int userId);
}
