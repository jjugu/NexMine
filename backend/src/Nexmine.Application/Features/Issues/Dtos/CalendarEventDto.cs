namespace Nexmine.Application.Features.Issues.Dtos;

public class CalendarEventDto
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? TrackerName { get; set; }
    public string? PriorityName { get; set; }
    public int? TrackerId { get; set; }
    public int? PriorityId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public bool IsClosed { get; set; }
}
