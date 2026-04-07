using System.Text;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Export.Interfaces;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Reports.Dtos;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ExportService : IExportService
{
    private const int MaxExportRows = 1000;
    private readonly NexmineDbContext _dbContext;

    public ExportService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<byte[]> ExportIssuesToCsvAsync(string projectIdentifier, IssueFilterParams filter)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var query = _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Include(i => i.Author)
            .Where(i => i.ProjectId == project.Id)
            .AsQueryable();

        if (filter.TrackerId.HasValue)
            query = query.Where(i => i.TrackerId == filter.TrackerId.Value);

        if (filter.StatusId.HasValue)
            query = query.Where(i => i.StatusId == filter.StatusId.Value);

        if (filter.PriorityId.HasValue)
            query = query.Where(i => i.PriorityId == filter.PriorityId.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(i => i.CategoryId == filter.CategoryId.Value);

        if (filter.VersionId.HasValue)
            query = query.Where(i => i.VersionId == filter.VersionId.Value);

        if (filter.AssignedToId.HasValue)
            query = query.Where(i => i.AssignedToId == filter.AssignedToId.Value);

        if (filter.AuthorId.HasValue)
            query = query.Where(i => i.AuthorId == filter.AuthorId.Value);

        if (filter.ParentIssueId.HasValue)
            query = query.Where(i => i.ParentIssueId == filter.ParentIssueId.Value);

        if (filter.IsPrivate.HasValue)
            query = query.Where(i => i.IsPrivate == filter.IsPrivate.Value);

        if (filter.IsClosed.HasValue)
            query = query.Where(i => i.Status.IsClosed == filter.IsClosed.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.ToLower();
            query = query.Where(i => i.Subject.ToLower().Contains(term));
        }

        var issues = await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(MaxExportRows)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("번호,제목,트래커,상태,우선순위,담당자,작성자,시작일,기한,진행률,예상시간,생성일,수정일");

        foreach (var issue in issues)
        {
            var assigneeName = issue.AssignedTo != null
                ? $"{issue.AssignedTo.FirstName} {issue.AssignedTo.LastName}".Trim()
                : "";
            var authorName = $"{issue.Author.FirstName} {issue.Author.LastName}".Trim();

            sb.AppendLine(string.Join(",",
                issue.Id,
                EscapeCsv(issue.Subject),
                EscapeCsv(issue.Tracker.Name),
                EscapeCsv(issue.Status.Name),
                EscapeCsv(issue.Priority.Name),
                EscapeCsv(assigneeName),
                EscapeCsv(authorName),
                issue.StartDate?.ToString("yyyy-MM-dd") ?? "",
                issue.DueDate?.ToString("yyyy-MM-dd") ?? "",
                issue.DoneRatio,
                issue.EstimatedHours?.ToString("0.##") ?? "",
                issue.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                issue.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            ));
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    public async Task<byte[]> ExportTimeReportToCsvAsync(TimeReportFilterParams filter)
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
            .Take(MaxExportRows)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("날짜,프로젝트,이슈,사용자,활동유형,시간,비고");

        foreach (var entry in entries)
        {
            var userName = $"{entry.User.FirstName} {entry.User.LastName}".Trim();
            var issueLabel = entry.Issue != null ? $"#{entry.Issue.Id} {entry.Issue.Subject}" : "";

            sb.AppendLine(string.Join(",",
                entry.SpentOn.ToString("yyyy-MM-dd"),
                EscapeCsv(entry.Project.Name),
                EscapeCsv(issueLabel),
                EscapeCsv(userName),
                EscapeCsv(entry.ActivityType.ToString()),
                entry.Hours.ToString("0.##"),
                EscapeCsv(entry.Comments ?? "")
            ));
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}
