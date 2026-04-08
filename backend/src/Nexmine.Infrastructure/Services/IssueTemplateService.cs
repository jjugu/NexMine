using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.IssueTemplates.Dtos;
using Nexmine.Application.Features.IssueTemplates.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class IssueTemplateService : IIssueTemplateService
{
    private readonly NexmineDbContext _dbContext;

    public IssueTemplateService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<IssueTemplateDto>> ListAsync(int? trackerId, int? projectId)
    {
        var query = _dbContext.IssueTemplates
            .Include(t => t.Tracker)
            .Include(t => t.Project)
            .AsQueryable();

        if (trackerId.HasValue)
            query = query.Where(t => t.TrackerId == trackerId.Value);

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        var templates = await query
            .OrderBy(t => t.Position)
            .ThenBy(t => t.Title)
            .ToListAsync();

        return templates.Select(MapToDto).ToList();
    }

    public async Task<IssueTemplateDto?> GetByIdAsync(int id)
    {
        var template = await _dbContext.IssueTemplates
            .Include(t => t.Tracker)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);

        return template is null ? null : MapToDto(template);
    }

    public async Task<List<IssueTemplateDto>> GetForIssueCreationAsync(int trackerId, string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var templates = await _dbContext.IssueTemplates
            .Include(t => t.Tracker)
            .Include(t => t.Project)
            .Where(t => t.TrackerId == trackerId && (t.ProjectId == project.Id || t.ProjectId == null))
            .OrderBy(t => t.Position)
            .ThenBy(t => t.Title)
            .ToListAsync();

        return templates.Select(MapToDto).ToList();
    }

    public async Task<IssueTemplateDto> CreateAsync(CreateIssueTemplateRequest request)
    {
        // Verify tracker exists
        var trackerExists = await _dbContext.Trackers.AnyAsync(t => t.Id == request.TrackerId);
        if (!trackerExists)
            throw new KeyNotFoundException($"트래커 ID '{request.TrackerId}'를 찾을 수 없습니다.");

        // Verify project if specified
        if (request.ProjectId.HasValue)
        {
            var projectExists = await _dbContext.Projects.AnyAsync(p => p.Id == request.ProjectId.Value);
            if (!projectExists)
                throw new KeyNotFoundException($"프로젝트 ID '{request.ProjectId.Value}'를 찾을 수 없습니다.");
        }

        // If isDefault, reset others in same tracker+project scope
        if (request.IsDefault)
        {
            await ResetDefaultAsync(request.TrackerId, request.ProjectId);
        }

        var template = new IssueTemplate
        {
            TrackerId = request.TrackerId,
            ProjectId = request.ProjectId,
            Title = request.Title,
            SubjectTemplate = request.SubjectTemplate,
            DescriptionTemplate = request.DescriptionTemplate,
            IsDefault = request.IsDefault,
            Position = request.Position
        };

        _dbContext.IssueTemplates.Add(template);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.IssueTemplates
            .Include(t => t.Tracker)
            .Include(t => t.Project)
            .FirstAsync(t => t.Id == template.Id);

        return MapToDto(created);
    }

    public async Task<IssueTemplateDto?> UpdateAsync(int id, UpdateIssueTemplateRequest request)
    {
        var template = await _dbContext.IssueTemplates
            .FirstOrDefaultAsync(t => t.Id == id);

        if (template is null)
            return null;

        if (request.Title is not null)
            template.Title = request.Title;

        if (request.SubjectTemplate is not null)
            template.SubjectTemplate = request.SubjectTemplate;

        if (request.DescriptionTemplate is not null)
            template.DescriptionTemplate = request.DescriptionTemplate;

        if (request.Position.HasValue)
            template.Position = request.Position.Value;

        if (request.IsDefault.HasValue)
        {
            // If setting as default, reset others in same tracker+project scope
            if (request.IsDefault.Value)
            {
                await ResetDefaultAsync(template.TrackerId, template.ProjectId);
            }
            template.IsDefault = request.IsDefault.Value;
        }

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.IssueTemplates
            .Include(t => t.Tracker)
            .Include(t => t.Project)
            .FirstAsync(t => t.Id == template.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var template = await _dbContext.IssueTemplates.FindAsync(id);
        if (template is null)
            return false;

        _dbContext.IssueTemplates.Remove(template);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private async Task ResetDefaultAsync(int trackerId, int? projectId)
    {
        var existing = await _dbContext.IssueTemplates
            .Where(t => t.TrackerId == trackerId && t.ProjectId == projectId && t.IsDefault)
            .ToListAsync();

        foreach (var item in existing)
        {
            item.IsDefault = false;
        }
    }

    private static IssueTemplateDto MapToDto(IssueTemplate template)
    {
        return new IssueTemplateDto
        {
            Id = template.Id,
            TrackerId = template.TrackerId,
            TrackerName = template.Tracker.Name,
            ProjectId = template.ProjectId,
            ProjectName = template.Project?.Name,
            Title = template.Title,
            SubjectTemplate = template.SubjectTemplate,
            DescriptionTemplate = template.DescriptionTemplate,
            IsDefault = template.IsDefault,
            Position = template.Position,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt
        };
    }
}
