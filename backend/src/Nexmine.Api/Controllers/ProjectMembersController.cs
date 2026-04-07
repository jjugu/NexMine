using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Application.Features.Projects.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/members")]
[Authorize]
public class ProjectMembersController : ControllerBase
{
    private readonly IProjectMemberService _projectMemberService;

    public ProjectMembersController(IProjectMemberService projectMemberService)
    {
        _projectMemberService = projectMemberService;
    }

    [HttpGet]
    [ProjectMember]
    [ProducesResponseType(typeof(List<ProjectMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListMembersAsync(string identifier)
    {
        var members = await _projectMemberService.ListMembersAsync(identifier);
        return Ok(members);
    }

    [HttpPost]
    [ProjectManager]
    [ProducesResponseType(typeof(ProjectMemberDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AddMemberAsync(string identifier, [FromBody] AddProjectMemberRequest request)
    {
        var member = await _projectMemberService.AddMemberAsync(identifier, request);
        return CreatedAtAction("ListMembers", new { identifier }, member);
    }

    [HttpDelete("{membershipId:int}")]
    [ProjectManager]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RemoveMemberAsync(string identifier, int membershipId)
    {
        var success = await _projectMemberService.RemoveMemberAsync(identifier, membershipId);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = "Membership not found."
            });
        }

        return NoContent();
    }
}
