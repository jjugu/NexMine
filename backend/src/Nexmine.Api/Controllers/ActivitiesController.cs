using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Activities.Dtos;
using Nexmine.Application.Features.Activities.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet("api/activities")]
    [ProducesResponseType(typeof(PagedResult<ActivityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGlobalActivityAsync([FromQuery] ActivityFilterParams filter)
    {
        var userId = User.GetUserId();
        var result = await _activityService.GetGlobalActivityAsync(userId, filter);
        return Ok(result);
    }

    [HttpGet("api/projects/{identifier}/activities")]
    [ProjectMember]
    [ProducesResponseType(typeof(PagedResult<ActivityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetProjectActivityAsync(string identifier, [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityService.GetProjectActivityAsync(identifier, filter);
        return Ok(result);
    }
}
