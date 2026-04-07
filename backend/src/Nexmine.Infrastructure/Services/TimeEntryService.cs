using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class TimeEntryService : ITimeEntryService
{
    private readonly NexmineDbContext _dbContext;

    public TimeEntryService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<TimeEntryDto>> ListAsync(TimeEntryFilterParams filterParams)
    {
        var query = _dbContext.TimeEntries
            .Include(te => te.User)
            .AsQueryable();

        if (filterParams.ProjectId.HasValue)
            query = query.Where(te => te.ProjectId == filterParams.ProjectId.Value);

        if (filterParams.IssueId.HasValue)
            query = query.Where(te => te.IssueId == filterParams.IssueId.Value);

        if (filterParams.UserId.HasValue)
            query = query.Where(te => te.UserId == filterParams.UserId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(te => te.SpentOn)
            .ThenByDescending(te => te.CreatedAt)
            .Skip((filterParams.Page - 1) * filterParams.PageSize)
            .Take(filterParams.PageSize)
            .ToListAsync();

        return new PagedResult<TimeEntryDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = filterParams.Page,
            PageSize = filterParams.PageSize
        };
    }

    public async Task<TimeEntryDto?> GetByIdAsync(int id)
    {
        var entry = await _dbContext.TimeEntries
            .Include(te => te.User)
            .FirstOrDefaultAsync(te => te.Id == id);

        return entry is null ? null : MapToDto(entry);
    }

    public async Task<TimeEntryDto> CreateAsync(CreateTimeEntryRequest request, int userId)
    {
        var projectExists = await _dbContext.Projects.AnyAsync(p => p.Id == request.ProjectId);
        if (!projectExists)
            throw new KeyNotFoundException("프로젝트를 찾을 수 없습니다.");

        if (request.IssueId.HasValue)
        {
            var issueExists = await _dbContext.Issues.AnyAsync(i => i.Id == request.IssueId.Value);
            if (!issueExists)
                throw new KeyNotFoundException("일감을 찾을 수 없습니다.");
        }

        var entry = new TimeEntry
        {
            ProjectId = request.ProjectId,
            IssueId = request.IssueId,
            UserId = userId,
            Hours = request.Hours,
            SpentOn = request.SpentOn,
            ActivityType = request.ActivityType,
            Comments = request.Comments
        };

        _dbContext.TimeEntries.Add(entry);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.TimeEntries
            .Include(te => te.User)
            .FirstAsync(te => te.Id == entry.Id);

        return MapToDto(created);
    }

    public async Task<TimeEntryDto?> UpdateAsync(int id, UpdateTimeEntryRequest request)
    {
        var entry = await _dbContext.TimeEntries
            .Include(te => te.User)
            .FirstOrDefaultAsync(te => te.Id == id);

        if (entry is null)
            return null;

        if (request.IssueId.HasValue)
            entry.IssueId = request.IssueId.Value;

        if (request.Hours.HasValue)
            entry.Hours = request.Hours.Value;

        if (request.SpentOn.HasValue)
            entry.SpentOn = request.SpentOn.Value;

        if (request.ActivityType.HasValue)
            entry.ActivityType = request.ActivityType.Value;

        if (request.Comments is not null)
            entry.Comments = request.Comments;

        await _dbContext.SaveChangesAsync();

        return MapToDto(entry);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entry = await _dbContext.TimeEntries.FindAsync(id);
        if (entry is null)
            return false;

        _dbContext.TimeEntries.Remove(entry);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static TimeEntryDto MapToDto(TimeEntry entry)
    {
        return new TimeEntryDto
        {
            Id = entry.Id,
            ProjectId = entry.ProjectId,
            IssueId = entry.IssueId,
            UserId = entry.UserId,
            UserName = $"{entry.User.FirstName} {entry.User.LastName}".Trim(),
            Hours = entry.Hours,
            SpentOn = entry.SpentOn,
            ActivityType = entry.ActivityType,
            Comments = entry.Comments,
            CreatedAt = entry.CreatedAt,
            UpdatedAt = entry.UpdatedAt
        };
    }
}
