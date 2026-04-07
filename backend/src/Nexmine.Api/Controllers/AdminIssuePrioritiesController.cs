using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/issue-priorities")]
[Authorize(Roles = "Admin")]
public class AdminIssuePrioritiesController : ControllerBase
{
    private readonly IAdminPriorityService _adminPriorityService;

    public AdminIssuePrioritiesController(IAdminPriorityService adminPriorityService)
    {
        _adminPriorityService = adminPriorityService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AdminPriorityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var priorities = await _adminPriorityService.ListAsync();
        return Ok(priorities);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminPriorityDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreatePriorityRequest request)
    {
        var priority = await _adminPriorityService.CreateAsync(request);
        return CreatedAtAction("List", "AdminIssuePriorities", null, priority);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AdminPriorityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdatePriorityRequest request)
    {
        var priority = await _adminPriorityService.UpdateAsync(id, request);

        if (priority is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 우선순위를 찾을 수 없습니다."
            });
        }

        return Ok(priority);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _adminPriorityService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 우선순위를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
