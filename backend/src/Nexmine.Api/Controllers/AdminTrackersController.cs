using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/trackers")]
[Authorize(Roles = "Admin")]
public class AdminTrackersController : ControllerBase
{
    private readonly IAdminTrackerService _adminTrackerService;

    public AdminTrackersController(IAdminTrackerService adminTrackerService)
    {
        _adminTrackerService = adminTrackerService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AdminTrackerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var trackers = await _adminTrackerService.ListAsync();
        return Ok(trackers);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminTrackerDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateTrackerRequest request)
    {
        var tracker = await _adminTrackerService.CreateAsync(request);
        return CreatedAtAction("List", "AdminTrackers", null, tracker);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AdminTrackerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateTrackerRequest request)
    {
        var tracker = await _adminTrackerService.UpdateAsync(id, request);

        if (tracker is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "트래커를 찾을 수 없습니다."
            });
        }

        return Ok(tracker);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _adminTrackerService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "트래커를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
