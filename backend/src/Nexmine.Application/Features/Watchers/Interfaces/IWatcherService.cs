using Nexmine.Application.Features.Watchers.Dtos;

namespace Nexmine.Application.Features.Watchers.Interfaces;

public interface IWatcherService
{
    Task<List<WatcherDto>> GetWatchersAsync(string watchableType, int watchableId);
    Task AddWatcherAsync(string watchableType, int watchableId, int userId);
    Task RemoveWatcherAsync(string watchableType, int watchableId, int userId);
    Task<bool> IsWatchingAsync(string watchableType, int watchableId, int userId);
}
