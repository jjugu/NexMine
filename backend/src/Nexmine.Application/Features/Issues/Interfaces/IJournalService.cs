using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IJournalService
{
    Task<List<JournalDto>> ListByIssueAsync(int issueId);
    Task<JournalDto> AddJournalAsync(int issueId, CreateJournalRequest request, int userId);
}
