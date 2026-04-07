using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Reports.Dtos;
using Nexmine.Application.Features.Reports.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly NexmineDbContext _dbContext;

    public ReportService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TimeReportDto> GetTimeReportAsync(TimeReportFilterParams filter)
    {
        var query = _dbContext.TimeEntries
            .Include(te => te.Project)
            .Include(te => te.Issue)
            .Include(te => te.User)
            .AsQueryable();

        if (filter.ProjectId.HasValue)
            query = query.Where(te => te.ProjectId == filter.ProjectId.Value);

        if (filter.UserId.HasValue)
            query = query.Where(te => te.UserId == filter.UserId.Value);

        if (filter.From.HasValue)
            query = query.Where(te => te.SpentOn >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(te => te.SpentOn <= filter.To.Value);

        var entries = await query
            .OrderByDescending(te => te.SpentOn)
            .ThenByDescending(te => te.CreatedAt)
            .ToListAsync();

        var entryDtos = entries.Select(te => new TimeReportEntryDto
        {
            Id = te.Id,
            ProjectName = te.Project.Name,
            IssueSubject = te.Issue?.Subject,
            IssueId = te.IssueId,
            UserName = $"{te.User.FirstName} {te.User.LastName}".Trim(),
            ActivityType = te.ActivityType.ToString(),
            Hours = te.Hours,
            SpentOn = te.SpentOn,
            Comments = te.Comments
        }).ToList();

        var groups = filter.GroupBy switch
        {
            "project" => entryDtos
                .GroupBy(e => new { Key = e.ProjectName, Id = entries.First(te => te.Project.Name == e.ProjectName).ProjectId })
                .Select(g => new TimeReportGroupDto
                {
                    GroupKey = g.Key.Key,
                    GroupId = g.Key.Id,
                    TotalHours = g.Sum(e => e.Hours),
                    Entries = g.ToList()
                }).ToList(),

            "activity" => entryDtos
                .GroupBy(e => e.ActivityType)
                .Select(g => new TimeReportGroupDto
                {
                    GroupKey = g.Key,
                    GroupId = 0,
                    TotalHours = g.Sum(e => e.Hours),
                    Entries = g.ToList()
                }).ToList(),

            _ => entryDtos
                .GroupBy(e => new { Key = e.UserName, Id = entries.First(te => $"{te.User.FirstName} {te.User.LastName}".Trim() == e.UserName).UserId })
                .Select(g => new TimeReportGroupDto
                {
                    GroupKey = g.Key.Key,
                    GroupId = g.Key.Id,
                    TotalHours = g.Sum(e => e.Hours),
                    Entries = g.ToList()
                }).ToList()
        };

        return new TimeReportDto
        {
            Groups = groups,
            TotalHours = entryDtos.Sum(e => e.Hours)
        };
    }
}
