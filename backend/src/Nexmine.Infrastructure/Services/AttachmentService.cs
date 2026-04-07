using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Documents.Dtos;
using Nexmine.Application.Features.Documents.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AttachmentService : IAttachmentService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IFileStorageService _fileStorageService;

    private const long MaxFileSize = 50 * 1024 * 1024; // 50MB

    public AttachmentService(NexmineDbContext dbContext, IFileStorageService fileStorageService)
    {
        _dbContext = dbContext;
        _fileStorageService = fileStorageService;
    }

    public async Task<AttachmentUploadResult> UploadAsync(IFormFile file, string attachableType, int attachableId, int userId)
    {
        if (file.Length == 0)
            throw new InvalidOperationException("파일이 비어 있습니다.");

        if (file.Length > MaxFileSize)
            throw new InvalidOperationException("파일 크기는 50MB를 초과할 수 없습니다.");

        var storedPath = await _fileStorageService.SaveAsync(file.OpenReadStream(), file.FileName);

        var attachment = new Attachment
        {
            FileName = file.FileName,
            StoredPath = storedPath,
            ContentType = file.ContentType,
            Size = file.Length,
            AttachableType = attachableType,
            AttachableId = attachableId,
            AuthorId = userId
        };

        _dbContext.Attachments.Add(attachment);
        await _dbContext.SaveChangesAsync();

        return new AttachmentUploadResult
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            Size = attachment.Size
        };
    }

    public async Task<AttachmentDto?> GetByIdAsync(int id)
    {
        var attachment = await _dbContext.Attachments
            .Include(a => a.Author)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attachment is null)
            return null;

        return MapToDto(attachment);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var attachment = await _dbContext.Attachments.FindAsync(id);
        if (attachment is null)
            return false;

        await _fileStorageService.DeleteAsync(attachment.StoredPath);
        _dbContext.Attachments.Remove(attachment);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<AttachmentDto>> ListByAttachableAsync(string attachableType, int attachableId)
    {
        var attachments = await _dbContext.Attachments
            .Include(a => a.Author)
            .Where(a => a.AttachableType == attachableType && a.AttachableId == attachableId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return attachments.Select(MapToDto).ToList();
    }

    public async Task<(Stream Stream, string ContentType, string FileName)?> DownloadAsync(int id)
    {
        var attachment = await _dbContext.Attachments.FindAsync(id);
        if (attachment is null)
            return null;

        var stream = await _fileStorageService.GetStreamAsync(attachment.StoredPath);
        return (stream, attachment.ContentType, attachment.FileName);
    }

    private static AttachmentDto MapToDto(Attachment attachment)
    {
        return new AttachmentDto
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            Size = attachment.Size,
            AttachableType = attachment.AttachableType,
            AttachableId = attachment.AttachableId,
            Description = attachment.Description,
            AuthorName = $"{attachment.Author.FirstName} {attachment.Author.LastName}".Trim(),
            CreatedAt = attachment.CreatedAt
        };
    }
}
