using Nexmine.Application.Features.IssueTemplates.Dtos;

namespace Nexmine.Application.Features.IssueTemplates.Interfaces;

public interface IIssueTemplateService
{
    Task<List<IssueTemplateDto>> ListAsync(int? trackerId, int? projectId);
    Task<IssueTemplateDto?> GetByIdAsync(int id);
    Task<List<IssueTemplateDto>> GetForIssueCreationAsync(int trackerId, string projectIdentifier);
    Task<IssueTemplateDto> CreateAsync(CreateIssueTemplateRequest request);
    Task<IssueTemplateDto?> UpdateAsync(int id, UpdateIssueTemplateRequest request);
    Task<bool> DeleteAsync(int id);
}
