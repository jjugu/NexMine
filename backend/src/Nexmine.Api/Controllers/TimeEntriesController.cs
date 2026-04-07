using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;

    public TimeEntriesController(ITimeEntryService timeEntryService)
    {
        _timeEntryService = timeEntryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Application.Common.Models.PagedResult<TimeEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync([FromQuery] TimeEntryFilterParams filterParams)
    {
        var result = await _timeEntryService.ListAsync(filterParams);
        return Ok(result);
    }

    [HttpGet("/api/issues/{issueId:int}/time-entries")]
    [ProducesResponseType(typeof(Application.Common.Models.PagedResult<TimeEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByIssueAsync(int issueId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var filterParams = new TimeEntryFilterParams
        {
            IssueId = issueId,
            Page = page,
            PageSize = pageSize
        };
        var result = await _timeEntryService.ListAsync(filterParams);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TimeEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var entry = await _timeEntryService.GetByIdAsync(id);

        if (entry is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "작업시간 기록을 찾을 수 없습니다."
            });
        }

        return Ok(entry);
    }

    [HttpPost]
    [ProducesResponseType(typeof(TimeEntryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateTimeEntryRequest request)
    {
        var userId = User.GetUserId();
        var entry = await _timeEntryService.CreateAsync(request, userId);
        return CreatedAtAction("GetById", new { id = entry.Id }, entry);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(TimeEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateTimeEntryRequest request)
    {
        var entry = await _timeEntryService.UpdateAsync(id, request);

        if (entry is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "작업시간 기록을 찾을 수 없습니다."
            });
        }

        return Ok(entry);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _timeEntryService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "작업시간 기록을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
