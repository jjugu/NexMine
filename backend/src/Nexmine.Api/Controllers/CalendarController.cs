using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _calendarService;

    public CalendarController(ICalendarService calendarService)
    {
        _calendarService = calendarService;
    }

    [HttpGet("api/projects/{identifier}/calendar")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<CalendarEventDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCalendarAsync(string identifier, [FromQuery] DateOnly start, [FromQuery] DateOnly end)
    {
        if (start > end)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "잘못된 요청",
                Detail = "시작 날짜는 종료 날짜보다 이전이어야 합니다."
            });
        }

        var events = await _calendarService.GetCalendarEventsAsync(identifier, start, end);
        return Ok(events);
    }
}
