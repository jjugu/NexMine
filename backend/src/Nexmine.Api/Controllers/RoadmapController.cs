using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Roadmap.Dtos;
using Nexmine.Application.Features.Roadmap.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class RoadmapController : ControllerBase
{
    private readonly IRoadmapService _roadmapService;

    public RoadmapController(IRoadmapService roadmapService)
    {
        _roadmapService = roadmapService;
    }

    [HttpGet("/api/projects/{identifier}/roadmap")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<RoadmapVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoadmapAsync(string identifier)
    {
        var roadmap = await _roadmapService.GetRoadmapAsync(identifier);
        return Ok(roadmap);
    }
}
