using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.CustomFields.Dtos;
using Nexmine.Application.Features.CustomFields.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class CustomFieldService : ICustomFieldService
{
    private readonly NexmineDbContext _dbContext;

    public CustomFieldService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CustomFieldDto>> ListAsync(string? customizable = null)
    {
        var query = _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(customizable))
        {
            query = query.Where(cf => cf.Customizable == customizable);
        }

        var fields = await query
            .OrderBy(cf => cf.Position)
            .ToListAsync();

        return fields.Select(MapToDto).ToList();
    }

    public async Task<CustomFieldDto?> GetByIdAsync(int id)
    {
        var field = await _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .FirstOrDefaultAsync(cf => cf.Id == id);

        if (field is null)
            return null;

        return MapToDto(field);
    }

    public async Task<CustomFieldDto> CreateAsync(CreateCustomFieldRequest request)
    {
        var field = new CustomField
        {
            Name = request.Name,
            FieldFormat = request.FieldFormat,
            Customizable = request.Customizable,
            IsRequired = request.IsRequired,
            IsForAll = request.IsForAll,
            IsFilter = request.IsFilter,
            MinLength = request.MinLength,
            MaxLength = request.MaxLength,
            Regexp = request.Regexp,
            PossibleValuesJson = request.PossibleValues is not null
                ? JsonSerializer.Serialize(request.PossibleValues)
                : null,
            DefaultValue = request.DefaultValue,
            Position = request.Position ?? 0,
            Description = request.Description
        };

        _dbContext.CustomFields.Add(field);
        await _dbContext.SaveChangesAsync();

        // Add project associations
        if (request.ProjectIds is { Length: > 0 })
        {
            foreach (var projectId in request.ProjectIds)
            {
                _dbContext.CustomFieldProjects.Add(new CustomFieldProject
                {
                    CustomFieldId = field.Id,
                    ProjectId = projectId
                });
            }
            await _dbContext.SaveChangesAsync();
        }

        // Add tracker associations
        if (request.TrackerIds is { Length: > 0 })
        {
            foreach (var trackerId in request.TrackerIds)
            {
                _dbContext.CustomFieldTrackers.Add(new CustomFieldTracker
                {
                    CustomFieldId = field.Id,
                    TrackerId = trackerId
                });
            }
            await _dbContext.SaveChangesAsync();
        }

        // Reload with navigation properties
        var created = await _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .FirstAsync(cf => cf.Id == field.Id);

        return MapToDto(created);
    }

    public async Task<CustomFieldDto?> UpdateAsync(int id, UpdateCustomFieldRequest request)
    {
        var field = await _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .FirstOrDefaultAsync(cf => cf.Id == id);

        if (field is null)
            return null;

        if (request.Name is not null)
            field.Name = request.Name;

        if (request.FieldFormat.HasValue)
            field.FieldFormat = request.FieldFormat.Value;

        if (request.IsRequired.HasValue)
            field.IsRequired = request.IsRequired.Value;

        if (request.IsForAll.HasValue)
            field.IsForAll = request.IsForAll.Value;

        if (request.IsFilter.HasValue)
            field.IsFilter = request.IsFilter.Value;

        if (request.MinLength.HasValue)
            field.MinLength = request.MinLength.Value;

        if (request.MaxLength.HasValue)
            field.MaxLength = request.MaxLength.Value;

        if (request.Regexp is not null)
            field.Regexp = request.Regexp;

        if (request.PossibleValues is not null)
            field.PossibleValuesJson = JsonSerializer.Serialize(request.PossibleValues);

        if (request.DefaultValue is not null)
            field.DefaultValue = request.DefaultValue;

        if (request.Position.HasValue)
            field.Position = request.Position.Value;

        if (request.Description is not null)
            field.Description = request.Description;

        // Update project associations
        if (request.ProjectIds is not null)
        {
            _dbContext.CustomFieldProjects.RemoveRange(field.Projects);
            foreach (var projectId in request.ProjectIds)
            {
                _dbContext.CustomFieldProjects.Add(new CustomFieldProject
                {
                    CustomFieldId = field.Id,
                    ProjectId = projectId
                });
            }
        }

        // Update tracker associations
        if (request.TrackerIds is not null)
        {
            _dbContext.CustomFieldTrackers.RemoveRange(field.Trackers);
            foreach (var trackerId in request.TrackerIds)
            {
                _dbContext.CustomFieldTrackers.Add(new CustomFieldTracker
                {
                    CustomFieldId = field.Id,
                    TrackerId = trackerId
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties
        var updated = await _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .FirstAsync(cf => cf.Id == field.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var field = await _dbContext.CustomFields.FindAsync(id);
        if (field is null)
            return false;

        _dbContext.CustomFields.Remove(field);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<CustomFieldDto>> GetForProjectAsync(string projectIdentifier, string customizable = "issue")
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var fields = await _dbContext.CustomFields
            .Include(cf => cf.Projects)
            .Include(cf => cf.Trackers)
            .Where(cf => cf.Customizable == customizable
                && (cf.IsForAll || cf.Projects.Any(p => p.ProjectId == project.Id)))
            .OrderBy(cf => cf.Position)
            .ToListAsync();

        return fields.Select(MapToDto).ToList();
    }

    public async Task<List<CustomValueDto>> GetValuesAsync(string customizableType, int customizableId)
    {
        var values = await _dbContext.CustomValues
            .Include(cv => cv.CustomField)
            .Where(cv => cv.CustomizableType == customizableType
                && cv.CustomizableId == customizableId)
            .ToListAsync();

        return values.Select(cv => new CustomValueDto
        {
            CustomFieldId = cv.CustomFieldId,
            CustomFieldName = cv.CustomField.Name,
            Value = cv.Value
        }).ToList();
    }

    public async Task SetValuesAsync(string customizableType, int customizableId, List<CustomValueItem> values)
    {
        // Validate that all custom field IDs exist
        var fieldIds = values.Select(v => v.CustomFieldId).Distinct().ToList();
        var existingFields = await _dbContext.CustomFields
            .Where(cf => fieldIds.Contains(cf.Id) && cf.Customizable == customizableType)
            .Select(cf => cf.Id)
            .ToListAsync();

        var invalidIds = fieldIds.Except(existingFields).ToList();
        if (invalidIds.Count > 0)
        {
            throw new KeyNotFoundException($"커스텀 필드를 찾을 수 없습니다: {string.Join(", ", invalidIds)}");
        }

        foreach (var item in values)
        {
            var existing = await _dbContext.CustomValues
                .FirstOrDefaultAsync(cv =>
                    cv.CustomFieldId == item.CustomFieldId
                    && cv.CustomizableType == customizableType
                    && cv.CustomizableId == customizableId);

            if (existing is not null)
            {
                existing.Value = item.Value;
            }
            else
            {
                _dbContext.CustomValues.Add(new CustomValue
                {
                    CustomFieldId = item.CustomFieldId,
                    CustomizableType = customizableType,
                    CustomizableId = customizableId,
                    Value = item.Value
                });
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    private static CustomFieldDto MapToDto(CustomField field)
    {
        string[]? possibleValues = null;
        if (!string.IsNullOrWhiteSpace(field.PossibleValuesJson))
        {
            possibleValues = JsonSerializer.Deserialize<string[]>(field.PossibleValuesJson);
        }

        return new CustomFieldDto
        {
            Id = field.Id,
            Name = field.Name,
            FieldFormat = field.FieldFormat,
            Customizable = field.Customizable,
            IsRequired = field.IsRequired,
            IsForAll = field.IsForAll,
            IsFilter = field.IsFilter,
            MinLength = field.MinLength,
            MaxLength = field.MaxLength,
            Regexp = field.Regexp,
            PossibleValues = possibleValues,
            DefaultValue = field.DefaultValue,
            Position = field.Position,
            Description = field.Description,
            ProjectIds = field.Projects.Select(p => p.ProjectId).ToArray(),
            TrackerIds = field.Trackers.Select(t => t.TrackerId).ToArray()
        };
    }
}
