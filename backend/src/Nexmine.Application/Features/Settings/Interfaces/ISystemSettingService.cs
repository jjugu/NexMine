namespace Nexmine.Application.Features.Settings.Interfaces;

public interface ISystemSettingService
{
    Task<string?> GetAsync(string key);
    Task SetAsync(string key, string value);
    Task<Dictionary<string, string>> GetAllAsync();
}
