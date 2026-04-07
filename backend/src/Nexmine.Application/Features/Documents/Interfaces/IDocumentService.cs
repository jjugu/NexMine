using Nexmine.Application.Features.Documents.Dtos;

namespace Nexmine.Application.Features.Documents.Interfaces;

public interface IDocumentService
{
    Task<List<DocumentDto>> ListAsync(string projectIdentifier);
    Task<DocumentDto?> GetByIdAsync(int id);
    Task<DocumentDto> CreateAsync(string projectIdentifier, CreateDocumentRequest request, int userId);
    Task<DocumentDto?> UpdateAsync(int id, UpdateDocumentRequest request);
    Task<bool> DeleteAsync(int id);
}
