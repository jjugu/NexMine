using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Activities.Dtos;

namespace Nexmine.Application.Features.Activities.Interfaces;

public interface IActivityService
{
    Task<PagedResult<ActivityDto>> GetGlobalActivityAsync(int userId, ActivityFilterParams filter);
    Task<PagedResult<ActivityDto>> GetProjectActivityAsync(string projectIdentifier, ActivityFilterParams filter);
}
