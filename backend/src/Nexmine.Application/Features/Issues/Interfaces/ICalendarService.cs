using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Application.Features.Issues.Interfaces;

public interface ICalendarService
{
    Task<List<CalendarEventDto>> GetCalendarEventsAsync(string projectIdentifier, DateOnly start, DateOnly end);
}
