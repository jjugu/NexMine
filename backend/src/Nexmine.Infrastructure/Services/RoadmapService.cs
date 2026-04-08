using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Roadmap.Dtos;
using Nexmine.Application.Features.Roadmap.Interfaces;
using Nexmine.Domain.Enums;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class RoadmapService : IRoadmapService
{
    private readonly NexmineDbContext _dbContext;

    public RoadmapService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<RoadmapVersionDto>> GetRoadmapAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var versions = await _dbContext.Versions
            .Where(v => v.ProjectId == project.Id)
            .OrderBy(v => v.Status == VersionStatus.Open ? 0 : v.Status == VersionStatus.Locked ? 1 : 2)
            .ThenBy(v => v.DueDate)
            .ThenBy(v => v.Name)
            .ToListAsync();

        var versionIds = versions.Select(v => v.Id).ToList();

        var issues = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.VersionId.HasValue && versionIds.Contains(i.VersionId.Value))
            .ToListAsync();

        var issuesByVersion = issues.GroupBy(i => i.VersionId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<RoadmapVersionDto>();

        foreach (var version in versions)
        {
            var versionIssues = issuesByVersion.GetValueOrDefault(version.Id, []);
            var closedCount = versionIssues.Count(i => i.Status.IsClosed);
            var totalCount = versionIssues.Count;

            result.Add(new RoadmapVersionDto
            {
                Id = version.Id,
                Name = version.Name,
                Description = version.Description,
                Status = (int)version.Status,
                DueDate = version.DueDate?.ToString("yyyy-MM-dd"),
                TotalIssues = totalCount,
                ClosedIssues = closedCount,
                OpenIssues = totalCount - closedCount,
                CompletionPercentage = totalCount > 0
                    ? Math.Round((decimal)closedCount / totalCount * 100, 1)
                    : 0,
                Issues = versionIssues.Select(i => new RoadmapIssueDto
                {
                    Id = i.Id,
                    Subject = i.Subject,
                    TrackerName = i.Tracker.Name,
                    StatusName = i.Status.Name,
                    IsClosed = i.Status.IsClosed,
                    PriorityName = i.Priority.Name,
                    AssigneeName = i.AssignedTo != null
                        ? $"{i.AssignedTo.FirstName} {i.AssignedTo.LastName}".Trim()
                        : null,
                    DoneRatio = i.DoneRatio
                }).ToList()
            });
        }

        return result;
    }
}
