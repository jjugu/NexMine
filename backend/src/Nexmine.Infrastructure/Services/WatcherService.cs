using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Watchers.Dtos;
using Nexmine.Application.Features.Watchers.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class WatcherService : IWatcherService
{
    private readonly NexmineDbContext _dbContext;

    public WatcherService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<WatcherDto>> GetWatchersAsync(string watchableType, int watchableId)
    {
        return await _dbContext.Watchers
            .Include(w => w.User)
            .Where(w => w.WatchableType == watchableType && w.WatchableId == watchableId)
            .Select(w => new WatcherDto
            {
                UserId = w.UserId,
                UserName = (w.User.FirstName + " " + w.User.LastName).Trim(),
                Email = w.User.Email
            })
            .ToListAsync();
    }

    public async Task AddWatcherAsync(string watchableType, int watchableId, int userId)
    {
        var exists = await _dbContext.Watchers
            .AnyAsync(w => w.WatchableType == watchableType
                && w.WatchableId == watchableId
                && w.UserId == userId);

        if (exists)
            return;

        var watcher = new Watcher
        {
            WatchableType = watchableType,
            WatchableId = watchableId,
            UserId = userId
        };

        _dbContext.Watchers.Add(watcher);
        await _dbContext.SaveChangesAsync();
    }

    public async Task RemoveWatcherAsync(string watchableType, int watchableId, int userId)
    {
        var watcher = await _dbContext.Watchers
            .FirstOrDefaultAsync(w => w.WatchableType == watchableType
                && w.WatchableId == watchableId
                && w.UserId == userId);

        if (watcher is null)
            return;

        _dbContext.Watchers.Remove(watcher);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> IsWatchingAsync(string watchableType, int watchableId, int userId)
    {
        return await _dbContext.Watchers
            .AnyAsync(w => w.WatchableType == watchableType
                && w.WatchableId == watchableId
                && w.UserId == userId);
    }
}
