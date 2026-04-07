using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IIssueService
{
    Task<PagedResult<IssueDto>> ListAsync(string projectIdentifier, IssueFilterParams filterParams);
    Task<IssueDetailDto?> GetByIdAsync(int id);
    Task<IssueDetailDto> CreateAsync(string projectIdentifier, CreateIssueRequest request, int userId);
    Task<IssueDetailDto?> UpdateAsync(int id, UpdateIssueRequest request, int userId);
    Task<bool> DeleteAsync(int id);
    Task<IssueDetailDto?> UpdatePositionAsync(int id, UpdateIssuePositionRequest request, int userId);
}
