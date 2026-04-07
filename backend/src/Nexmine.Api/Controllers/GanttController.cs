using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class GanttController : ControllerBase
{
    private readonly IGanttService _ganttService;

    public GanttController(IGanttService ganttService)
    {
        _ganttService = ganttService;
    }

    [HttpGet("api/projects/{identifier}/gantt")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<GanttIssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetGanttAsync(string identifier)
    {
        var issues = await _ganttService.GetGanttIssuesAsync(identifier);
        return Ok(issues);
    }
}
