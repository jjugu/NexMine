using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Interfaces;

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> ListAsync(int page, int pageSize, string? search);
    Task<ProjectDto?> GetByIdentifierAsync(string identifier);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId);
    Task<ProjectDto?> UpdateAsync(string identifier, UpdateProjectRequest request);
    Task<bool> ArchiveAsync(string identifier);
}
