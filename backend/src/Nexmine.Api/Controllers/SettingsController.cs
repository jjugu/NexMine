using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Settings.Dtos;
using Nexmine.Application.Features.Settings.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    private readonly ISystemSettingService _systemSettingService;

    public SettingsController(ISystemSettingService systemSettingService)
    {
        _systemSettingService = systemSettingService;
    }

    [HttpGet("registration-mode")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RegistrationModeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRegistrationModeAsync()
    {
        var mode = await _systemSettingService.GetAsync("registration_mode") ?? "open";

        return Ok(new RegistrationModeResponse { Mode = mode });
    }
}
