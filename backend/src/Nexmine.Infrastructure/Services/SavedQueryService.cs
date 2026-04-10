using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.SavedQueries.Dtos;
using Nexmine.Application.Features.SavedQueries.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Domain.Exceptions;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class SavedQueryService : ISavedQueryService
{
    private readonly NexmineDbContext _dbContext;

    public SavedQueryService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<SavedQueryDto>> ListAsync(int userId, int? projectId = null)
    {
        var query = _dbContext.SavedQueries
            .Include(q => q.User)
            .Include(q => q.Project)
            .AsQueryable();

        if (projectId.HasValue)
        {
            // My queries for this project + public queries for this project
            query = query.Where(q =>
                (q.UserId == userId && q.ProjectId == projectId.Value) ||
                (q.IsPublic && q.ProjectId == projectId.Value));
        }
        else
        {
            // My global queries + public global queries
            query = query.Where(q =>
                (q.UserId == userId && q.ProjectId == null) ||
                (q.IsPublic && q.ProjectId == null));
        }

        var savedQueries = await query
            .OrderBy(q => q.Position)
            .ThenBy(q => q.Name)
            .ToListAsync();

        return savedQueries.Select(MapToDto).ToList();
    }

    public async Task<SavedQueryDto?> GetByIdAsync(int id)
    {
        var savedQuery = await _dbContext.SavedQueries
            .Include(q => q.User)
            .Include(q => q.Project)
            .FirstOrDefaultAsync(q => q.Id == id);

        return savedQuery is null ? null : MapToDto(savedQuery);
    }

    public async Task<SavedQueryDto> CreateAsync(CreateSavedQueryRequest request, int userId)
    {
        var maxPosition = await _dbContext.SavedQueries
            .Where(q => q.UserId == userId && q.ProjectId == request.ProjectId)
            .MaxAsync(q => (int?)q.Position) ?? 0;

        var savedQuery = new SavedQuery
        {
            UserId = userId,
            ProjectId = request.ProjectId,
            Name = request.Name,
            FiltersJson = JsonSerializer.Serialize(request.Filters),
            IsPublic = request.IsPublic,
            Position = maxPosition + 1
        };

        _dbContext.SavedQueries.Add(savedQuery);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.SavedQueries
            .Include(q => q.User)
            .Include(q => q.Project)
            .FirstAsync(q => q.Id == savedQuery.Id);

        return MapToDto(created);
    }

    public async Task<SavedQueryDto?> UpdateAsync(int id, UpdateSavedQueryRequest request, int userId)
    {
        var savedQuery = await _dbContext.SavedQueries
            .FirstOrDefaultAsync(q => q.Id == id);

        if (savedQuery is null)
            return null;

        // Only the owner or admin can update
        var user = await _dbContext.Users.FindAsync(userId);
        if (savedQuery.UserId != userId && user?.IsAdmin != true)
            throw new ForbiddenAccessException("본인의 필터만 수정할 수 있습니다.");

        if (request.Name is not null)
            savedQuery.Name = request.Name;

        if (request.Filters is not null)
            savedQuery.FiltersJson = JsonSerializer.Serialize(request.Filters);

        if (request.IsPublic.HasValue)
            savedQuery.IsPublic = request.IsPublic.Value;

        if (request.Position.HasValue)
            savedQuery.Position = request.Position.Value;

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.SavedQueries
            .Include(q => q.User)
            .Include(q => q.Project)
            .FirstAsync(q => q.Id == savedQuery.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var savedQuery = await _dbContext.SavedQueries.FindAsync(id);
        if (savedQuery is null)
            return false;

        // Only the owner or admin can delete
        var user = await _dbContext.Users.FindAsync(userId);
        if (savedQuery.UserId != userId && user?.IsAdmin != true)
            throw new ForbiddenAccessException("본인의 필터만 삭제할 수 있습니다.");

        _dbContext.SavedQueries.Remove(savedQuery);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static SavedQueryDto MapToDto(SavedQuery query)
    {
        return new SavedQueryDto
        {
            Id = query.Id,
            UserId = query.UserId,
            UserName = query.User.Username,
            ProjectId = query.ProjectId,
            ProjectName = query.Project?.Name,
            Name = query.Name,
            Filters = DeserializeFilters(query.FiltersJson),
            IsPublic = query.IsPublic,
            Position = query.Position
        };
    }

    private static Dictionary<string, string> DeserializeFilters(string filtersJson)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(filtersJson)
                ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}
