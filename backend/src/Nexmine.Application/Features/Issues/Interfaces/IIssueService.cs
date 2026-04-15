using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IIssueService
{
    Task<PagedResult<IssueDto>> ListAsync(string projectIdentifier, IssueFilterParams filterParams);
    Task<IssueDetailDto?> GetByIdAsync(int id, int userId);
    Task<IssueDetailDto> CreateAsync(string projectIdentifier, CreateIssueRequest request, int userId);
    Task<IssueDetailDto?> UpdateAsync(int id, UpdateIssueRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<IssueDetailDto?> UpdatePositionAsync(int id, UpdateIssuePositionRequest request, int userId);
    Task<int> BulkUpdateAsync(BulkUpdateIssuesRequest request, int userId);
    Task<IssueDetailDto> CopyIssueAsync(int issueId, CopyIssueRequest request, int userId);
    Task<IssueDetailDto> MoveIssueAsync(int issueId, MoveIssueRequest request, int userId);
    Task<ImportIssuesResult> ImportFromCsvAsync(string projectIdentifier, Stream csvStream, int userId);
}
