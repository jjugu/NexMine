using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class CalendarService : ICalendarService
{
    private readonly NexmineDbContext _dbContext;

    public CalendarService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CalendarEventDto>> GetCalendarEventsAsync(string projectIdentifier, DateOnly start, DateOnly end)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var events = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Priority)
            .Include(i => i.Status)
            .Where(i => i.ProjectId == project.Id)
            .Where(i => i.StartDate != null || i.DueDate != null)
            .Where(i =>
                (i.StartDate != null && i.StartDate >= start && i.StartDate <= end) ||
                (i.DueDate != null && i.DueDate >= start && i.DueDate <= end))
            .OrderBy(i => i.StartDate ?? i.DueDate)
            .Select(i => new CalendarEventDto
            {
                Id = i.Id,
                Subject = i.Subject,
                TrackerName = i.Tracker.Name,
                PriorityName = i.Priority.Name,
                TrackerId = i.TrackerId,
                PriorityId = i.PriorityId,
                StartDate = i.StartDate,
                DueDate = i.DueDate,
                IsClosed = i.Status.IsClosed
            })
            .ToListAsync();

        return events;
    }
}
