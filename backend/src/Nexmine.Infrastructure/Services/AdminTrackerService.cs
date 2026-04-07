using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AdminTrackerService : IAdminTrackerService
{
    private readonly NexmineDbContext _dbContext;

    public AdminTrackerService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminTrackerDto>> ListAsync()
    {
        return await _dbContext.Trackers
            .OrderBy(t => t.Position)
            .Select(t => new AdminTrackerDto
            {
                Id = t.Id,
                Name = t.Name,
                Position = t.Position,
                IsDefault = t.IsDefault
            })
            .ToListAsync();
    }

    public async Task<AdminTrackerDto> CreateAsync(CreateTrackerRequest request)
    {
        var tracker = new Tracker
        {
            Name = request.Name,
            Position = request.Position ?? 0,
            IsDefault = request.IsDefault ?? false
        };

        if (tracker.IsDefault)
        {
            await _dbContext.Trackers.Where(t => t.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(t => t.IsDefault, false));
        }

        _dbContext.Trackers.Add(tracker);
        await _dbContext.SaveChangesAsync();

        return new AdminTrackerDto
        {
            Id = tracker.Id,
            Name = tracker.Name,
            Position = tracker.Position,
            IsDefault = tracker.IsDefault
        };
    }

    public async Task<AdminTrackerDto?> UpdateAsync(int id, UpdateTrackerRequest request)
    {
        var tracker = await _dbContext.Trackers.FindAsync(id);
        if (tracker is null) return null;

        if (request.Name is not null) tracker.Name = request.Name;
        if (request.Position.HasValue) tracker.Position = request.Position.Value;
        if (request.IsDefault.HasValue)
        {
            tracker.IsDefault = request.IsDefault.Value;
            if (tracker.IsDefault)
            {
                await _dbContext.Trackers.Where(t => t.Id != id && t.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(t => t.IsDefault, false));
            }
        }

        await _dbContext.SaveChangesAsync();

        return new AdminTrackerDto
        {
            Id = tracker.Id,
            Name = tracker.Name,
            Position = tracker.Position,
            IsDefault = tracker.IsDefault
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tracker = await _dbContext.Trackers.FindAsync(id);
        if (tracker is null) return false;

        var hasIssues = await _dbContext.Issues.AnyAsync(i => i.TrackerId == id);
        if (hasIssues)
        {
            throw new InvalidOperationException("이 트래커를 사용하는 이슈가 있어 삭제할 수 없습니다.");
        }

        _dbContext.Trackers.Remove(tracker);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
