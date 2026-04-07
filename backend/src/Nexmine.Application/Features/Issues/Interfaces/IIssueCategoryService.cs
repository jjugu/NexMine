using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IIssueCategoryService
{
    Task<List<IssueCategoryDto>> ListByProjectAsync(string projectIdentifier);
    Task<IssueCategoryDto> CreateAsync(string projectIdentifier, CreateIssueCategoryRequest request);
    Task<IssueCategoryDto?> UpdateAsync(int id, UpdateIssueCategoryRequest request);
    Task<bool> DeleteAsync(int id);
}
