using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/versions")]
[Authorize]
public class VersionsController : ControllerBase
{
    private readonly IVersionService _versionService;

    public VersionsController(IVersionService versionService)
    {
        _versionService = versionService;
    }

    [HttpGet]
    [ProjectMember]
    [ProducesResponseType(typeof(List<VersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(string identifier)
    {
        var versions = await _versionService.ListByProjectAsync(identifier);
        return Ok(versions);
    }

    [HttpPost]
    [ProjectManager]
    [ProducesResponseType(typeof(VersionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateVersionRequest request)
    {
        var version = await _versionService.CreateAsync(identifier, request);
        return CreatedAtAction("GetById", "Versions", new { id = version.Id }, version);
    }

    [HttpGet("/api/versions/{id:int}")]
    [ProducesResponseType(typeof(VersionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var version = await _versionService.GetByIdAsync(id);

        if (version is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "버전을 찾을 수 없습니다."
            });
        }

        return Ok(version);
    }

    [HttpPut("/api/versions/{id:int}")]
    [ProducesResponseType(typeof(VersionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateVersionRequest request)
    {
        var version = await _versionService.UpdateAsync(id, request);

        if (version is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "버전을 찾을 수 없습니다."
            });
        }

        return Ok(version);
    }

    [HttpDelete("/api/versions/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _versionService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "버전을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
