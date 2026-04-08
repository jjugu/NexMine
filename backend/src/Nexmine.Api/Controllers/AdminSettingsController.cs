using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Settings.Dtos;
using Nexmine.Application.Features.Settings.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminSettingsController : ControllerBase
{
    private readonly ISystemSettingService _systemSettingService;

    public AdminSettingsController(ISystemSettingService systemSettingService)
    {
        _systemSettingService = systemSettingService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Dictionary<string, string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllAsync()
    {
        var settings = await _systemSettingService.GetAllAsync();
        return Ok(settings);
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAsync([FromBody] UpdateSettingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = "설정 키는 필수입니다."
            });
        }

        await _systemSettingService.SetAsync(request.Key, request.Value ?? "");
        return Ok();
    }
}
