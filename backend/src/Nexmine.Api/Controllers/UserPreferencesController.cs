using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.UserPreferences.Dtos;
using Nexmine.Application.Features.UserPreferences.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class UserPreferencesController : ControllerBase
{
    private readonly IUserPreferenceService _userPreferenceService;

    public UserPreferencesController(IUserPreferenceService userPreferenceService)
    {
        _userPreferenceService = userPreferenceService;
    }

    [HttpGet("api/my/preferences")]
    [ProducesResponseType(typeof(UserPreferenceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferencesAsync()
    {
        var userId = User.GetUserId();
        var result = await _userPreferenceService.GetAsync(userId);
        return Ok(result);
    }

    [HttpPut("api/my/preferences")]
    [ProducesResponseType(typeof(UserPreferenceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferencesAsync([FromBody] UpdateUserPreferenceRequest request)
    {
        var userId = User.GetUserId();
        var result = await _userPreferenceService.UpdateAsync(userId, request);
        return Ok(result);
    }
}
