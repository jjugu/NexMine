using Microsoft.AspNetCore.Http;
using Nexmine.Application.Features.Documents.Dtos;

namespace Nexmine.Application.Features.Documents.Interfaces;

public interface IAttachmentService
{
    Task<AttachmentUploadResult> UploadAsync(IFormFile file, string attachableType, int attachableId, int userId);
    Task<AttachmentDto?> GetByIdAsync(int id);
    Task<bool> DeleteAsync(int id);
    Task<List<AttachmentDto>> ListByAttachableAsync(string attachableType, int attachableId);
    Task<(Stream Stream, string ContentType, string FileName)?> DownloadAsync(int id);
}
