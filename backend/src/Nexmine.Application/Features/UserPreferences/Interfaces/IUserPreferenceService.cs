using Nexmine.Application.Features.UserPreferences.Dtos;

namespace Nexmine.Application.Features.UserPreferences.Interfaces;

public interface IUserPreferenceService
{
    Task<UserPreferenceDto> GetAsync(int userId);
    Task<UserPreferenceDto> UpdateAsync(int userId, UpdateUserPreferenceRequest request);
}
