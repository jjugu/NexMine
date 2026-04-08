using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Charts.Dtos;
using Nexmine.Application.Features.Charts.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/charts")]
[Authorize]
public class ChartsController : ControllerBase
{
    private readonly IChartService _chartService;

    public ChartsController(IChartService chartService)
    {
        _chartService = chartService;
    }

    [HttpGet("issue-trend")]
    [ProjectMember]
    [ProducesResponseType(typeof(IssueTrendDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetIssueTrendAsync(string identifier, [FromQuery] int days = 30)
    {
        if (days < 1 || days > 365)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "유효하지 않은 파라미터",
                Detail = "days는 1에서 365 사이여야 합니다."
            });
        }

        var result = await _chartService.GetIssueTrendAsync(identifier, days);
        return Ok(result);
    }

    [HttpGet("burndown")]
    [ProjectMember]
    [ProducesResponseType(typeof(BurndownDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBurndownAsync(string identifier, [FromQuery] int versionId)
    {
        if (versionId <= 0)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "유효하지 않은 파라미터",
                Detail = "유효한 versionId를 지정해야 합니다."
            });
        }

        var result = await _chartService.GetBurndownAsync(identifier, versionId);
        return Ok(result);
    }
}
