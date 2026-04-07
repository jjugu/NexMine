using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Dashboard.Dtos;
using Nexmine.Application.Features.Dashboard.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("api/dashboard")]
    [ProducesResponseType(typeof(DashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGlobalDashboardAsync()
    {
        var userId = User.GetUserId();
        var dashboard = await _dashboardService.GetGlobalDashboardAsync(userId);
        return Ok(dashboard);
    }

    [HttpGet("api/projects/{identifier}/dashboard")]
    [ProjectMember]
    [ProducesResponseType(typeof(ProjectDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetProjectDashboardAsync(string identifier)
    {
        var userId = User.GetUserId();
        var dashboard = await _dashboardService.GetProjectDashboardAsync(identifier, userId);
        return Ok(dashboard);
    }
}
