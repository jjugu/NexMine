using Nexmine.Application.Features.Wiki.Dtos;

namespace Nexmine.Application.Features.Wiki.Interfaces;

public interface IWikiService
{
    Task<List<WikiPageDto>> ListAsync(string projectIdentifier);
    Task<WikiPageDetailDto?> GetBySlugAsync(string projectIdentifier, string slug);
    Task<WikiPageDetailDto> CreateAsync(string projectIdentifier, CreateWikiPageRequest request, int userId);
    Task<WikiPageDetailDto?> UpdateAsync(string projectIdentifier, string slug, UpdateWikiPageRequest request, int userId);
    Task<bool> DeleteAsync(string projectIdentifier, string slug);
    Task<List<WikiPageVersionDto>> GetVersionsAsync(string projectIdentifier, string slug);
    Task<WikiPageVersionDto?> GetVersionAsync(string projectIdentifier, string slug, int version);
}
