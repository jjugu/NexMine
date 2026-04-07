using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface IGanttService
{
    Task<List<GanttIssueDto>> GetGanttIssuesAsync(string projectIdentifier);
}
