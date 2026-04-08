using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Documents.Interfaces;
using Nexmine.Application.Features.Settings.Dtos;
using Nexmine.Application.Features.Settings.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    private readonly ISystemSettingService _systemSettingService;
    private readonly IAttachmentService _attachmentService;

    public SettingsController(ISystemSettingService systemSettingService, IAttachmentService attachmentService)
    {
        _systemSettingService = systemSettingService;
        _attachmentService = attachmentService;
    }

    [HttpGet("registration-mode")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RegistrationModeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRegistrationModeAsync()
    {
        var mode = await _systemSettingService.GetAsync("registration_mode") ?? "open";

        return Ok(new RegistrationModeResponse { Mode = mode });
    }

    [HttpGet("app")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AppSettingsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAppSettingsAsync()
    {
        var response = new AppSettingsResponse
        {
            AppName = await _systemSettingService.GetAsync("app_name") ?? "Nexmine",
            AppDescription = await _systemSettingService.GetAsync("app_description"),
            PrimaryColor = await _systemSettingService.GetAsync("primary_color") ?? "#1976d2",
            LogoUrl = await _systemSettingService.GetAsync("logo_url"),
            DefaultLanguage = await _systemSettingService.GetAsync("default_language") ?? "ko"
        };

        return Ok(response);
    }

    [HttpGet("logo")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogoAsync()
    {
        var logoUrl = await _systemSettingService.GetAsync("logo_url");
        if (string.IsNullOrEmpty(logoUrl))
            return NotFound();

        // Extract attachment ID from URL pattern: /api/attachments/{id}/download
        if (logoUrl.Contains("/attachments/") && logoUrl.Contains("/download"))
        {
            var parts = logoUrl.Split('/');
            var idIndex = Array.IndexOf(parts, "attachments") + 1;
            if (idIndex > 0 && idIndex < parts.Length && int.TryParse(parts[idIndex], out var attachmentId))
            {
                var result = await _attachmentService.DownloadAsync(attachmentId);
                if (result is not null)
                    return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
            }
        }

        // If it's an external URL, redirect
        return Redirect(logoUrl);
    }
}
