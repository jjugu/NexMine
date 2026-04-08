using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.UserPreferences.Dtos;
using Nexmine.Application.Features.UserPreferences.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class UserPreferenceService : IUserPreferenceService
{
    private readonly NexmineDbContext _dbContext;

    public UserPreferenceService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserPreferenceDto> GetAsync(int userId)
    {
        var preference = await _dbContext.UserPreferences
            .FirstOrDefaultAsync(up => up.UserId == userId);

        if (preference is null)
        {
            preference = new UserPreference { UserId = userId };
            _dbContext.UserPreferences.Add(preference);
            await _dbContext.SaveChangesAsync();
        }

        return MapToDto(preference);
    }

    public async Task<UserPreferenceDto> UpdateAsync(int userId, UpdateUserPreferenceRequest request)
    {
        var preference = await _dbContext.UserPreferences
            .FirstOrDefaultAsync(up => up.UserId == userId);

        if (preference is null)
        {
            preference = new UserPreference { UserId = userId };
            _dbContext.UserPreferences.Add(preference);
        }

        if (request.Language is not null)
            preference.Language = request.Language;

        if (request.Timezone is not null)
            preference.Timezone = request.Timezone;

        if (request.PageSize.HasValue)
            preference.PageSize = request.PageSize.Value;

        if (request.Theme is not null)
            preference.Theme = request.Theme;

        if (request.EmailNotifications.HasValue)
            preference.EmailNotifications = request.EmailNotifications.Value;

        await _dbContext.SaveChangesAsync();

        return MapToDto(preference);
    }

    private static UserPreferenceDto MapToDto(UserPreference preference)
    {
        return new UserPreferenceDto
        {
            Language = preference.Language,
            Timezone = preference.Timezone,
            PageSize = preference.PageSize,
            Theme = preference.Theme,
            EmailNotifications = preference.EmailNotifications
        };
    }
}
