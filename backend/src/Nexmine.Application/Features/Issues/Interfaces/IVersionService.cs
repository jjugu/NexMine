using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IVersionService
{
    Task<List<VersionDto>> ListByProjectAsync(string projectIdentifier);
    Task<VersionDto?> GetByIdAsync(int id);
    Task<VersionDto> CreateAsync(string projectIdentifier, CreateVersionRequest request);
    Task<VersionDto?> UpdateAsync(int id, UpdateVersionRequest request);
    Task<bool> DeleteAsync(int id);
}
