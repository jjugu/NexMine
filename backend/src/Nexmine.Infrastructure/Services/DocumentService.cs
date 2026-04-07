using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Documents.Dtos;
using Nexmine.Application.Features.Documents.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly NexmineDbContext _dbContext;

    public DocumentService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<DocumentDto>> ListAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var documents = await _dbContext.Documents
            .Include(d => d.Author)
            .Where(d => d.ProjectId == project.Id)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();

        return documents.Select(MapToDto).ToList();
    }

    public async Task<DocumentDto?> GetByIdAsync(int id)
    {
        var document = await _dbContext.Documents
            .Include(d => d.Author)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document is null)
            return null;

        var attachments = await _dbContext.Attachments
            .Where(a => a.AttachableType == "Document" && a.AttachableId == id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var dto = MapToDto(document);
        dto.Attachments = attachments.Select(a => new DocumentAttachmentDto
        {
            Id = a.Id,
            FileName = a.FileName,
            ContentType = a.ContentType,
            Size = a.Size,
            CreatedAt = a.CreatedAt,
        }).ToList();

        return dto;
    }

    public async Task<DocumentDto> CreateAsync(string projectIdentifier, CreateDocumentRequest request, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var document = new Document
        {
            ProjectId = project.Id,
            Title = request.Title,
            Description = request.Description,
            CategoryName = request.CategoryName,
            AuthorId = userId
        };

        _dbContext.Documents.Add(document);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.Documents
            .Include(d => d.Author)
            .FirstAsync(d => d.Id == document.Id);

        return MapToDto(created);
    }

    public async Task<DocumentDto?> UpdateAsync(int id, UpdateDocumentRequest request)
    {
        var document = await _dbContext.Documents
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document is null)
            return null;

        if (request.Title is not null)
            document.Title = request.Title;

        if (request.Description is not null)
            document.Description = request.Description;

        if (request.CategoryName is not null)
            document.CategoryName = request.CategoryName;

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.Documents
            .Include(d => d.Author)
            .FirstAsync(d => d.Id == document.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var document = await _dbContext.Documents.FindAsync(id);
        if (document is null)
            return false;

        _dbContext.Documents.Remove(document);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static DocumentDto MapToDto(Document document)
    {
        return new DocumentDto
        {
            Id = document.Id,
            Title = document.Title,
            Description = document.Description,
            CategoryName = document.CategoryName,
            AuthorName = $"{document.Author.FirstName} {document.Author.LastName}".Trim(),
            CreatedAt = document.CreatedAt,
            UpdatedAt = document.UpdatedAt
        };
    }
}
