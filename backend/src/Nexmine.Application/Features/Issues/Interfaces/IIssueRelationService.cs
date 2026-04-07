using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IIssueRelationService
{
    Task<List<IssueRelationDto>> ListByIssueAsync(int issueId);
    Task<IssueRelationDto> CreateAsync(int issueId, CreateIssueRelationRequest request);
    Task<bool> DeleteAsync(int issueId, int relationId);
}
