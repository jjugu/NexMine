using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/issue-statuses")]
[Authorize(Roles = "Admin")]
public class AdminIssueStatusesController : ControllerBase
{
    private readonly IAdminStatusService _adminStatusService;

    public AdminIssueStatusesController(IAdminStatusService adminStatusService)
    {
        _adminStatusService = adminStatusService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AdminStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var statuses = await _adminStatusService.ListAsync();
        return Ok(statuses);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminStatusDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateStatusRequest request)
    {
        var status = await _adminStatusService.CreateAsync(request);
        return CreatedAtAction("List", "AdminIssueStatuses", null, status);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AdminStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateStatusRequest request)
    {
        var status = await _adminStatusService.UpdateAsync(id, request);

        if (status is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 상태를 찾을 수 없습니다."
            });
        }

        return Ok(status);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _adminStatusService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 상태를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
