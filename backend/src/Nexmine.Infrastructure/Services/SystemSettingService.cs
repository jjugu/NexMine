using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Settings.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class SystemSettingService : ISystemSettingService
{
    private readonly NexmineDbContext _dbContext;

    public SystemSettingService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<string?> GetAsync(string key)
    {
        var setting = await _dbContext.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        return setting?.Value;
    }

    public async Task SetAsync(string key, string value)
    {
        var setting = await _dbContext.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting is null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value
            };
            _dbContext.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<Dictionary<string, string>> GetAllAsync()
    {
        return await _dbContext.SystemSettings
            .ToDictionaryAsync(s => s.Key, s => s.Value);
    }
}
