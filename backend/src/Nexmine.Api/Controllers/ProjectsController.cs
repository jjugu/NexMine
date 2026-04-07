using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Application.Features.Projects.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Application.Common.Models.PagedResult<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _projectService.ListAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateProjectRequest request)
    {
        var userId = User.GetUserId();
        var project = await _projectService.CreateAsync(request, userId);
        return CreatedAtAction("GetByIdentifier", new { identifier = project.Identifier }, project);
    }

    [HttpGet("{identifier}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdentifierAsync(string identifier)
    {
        var project = await _projectService.GetByIdentifierAsync(identifier);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return Ok(project);
    }

    [HttpPut("{identifier}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(string identifier, [FromBody] UpdateProjectRequest request)
    {
        var project = await _projectService.UpdateAsync(identifier, request);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return Ok(project);
    }

    [HttpDelete("{identifier}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveAsync(string identifier)
    {
        var success = await _projectService.ArchiveAsync(identifier);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
