using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Export.Interfaces;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Reports.Dtos;
using Nexmine.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Nexmine.Infrastructure.Services;

public class ExportService : IExportService
{
    private const int MaxExportRows = 1000;
    private readonly NexmineDbContext _dbContext;

    static ExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

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

    public async Task<byte[]> ExportIssueToPdfAsync(int issueId)
    {
        var issue = await _dbContext.Issues
            .Include(i => i.Project)
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Include(i => i.Author)
            .Include(i => i.Journals.OrderBy(j => j.CreatedAt))
                .ThenInclude(j => j.User)
            .Include(i => i.Journals)
                .ThenInclude(j => j.Details)
            .FirstOrDefaultAsync(i => i.Id == issueId)
            ?? throw new KeyNotFoundException($"이슈 #{issueId}를 찾을 수 없습니다.");

        var authorName = FormatUserName(issue.Author);
        var assigneeName = issue.AssignedTo is not null ? FormatUserName(issue.AssignedTo) : "-";
        var description = StripHtml(issue.Description ?? "");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Text($"#{issue.Id} {issue.Subject}")
                    .FontSize(16).Bold();

                page.Content().PaddingVertical(10).Column(col =>
                {
                    // Meta information table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                        });

                        AddMetaRow(table, "프로젝트", issue.Project.Name, "트래커", issue.Tracker.Name);
                        AddMetaRow(table, "상태", issue.Status.Name, "우선순위", issue.Priority.Name);
                        AddMetaRow(table, "담당자", assigneeName, "작성자", authorName);
                        AddMetaRow(table, "시작일", issue.StartDate?.ToString("yyyy-MM-dd") ?? "-", "기한", issue.DueDate?.ToString("yyyy-MM-dd") ?? "-");
                        AddMetaRow(table, "진행률", $"{issue.DoneRatio}%", "예상시간", issue.EstimatedHours?.ToString("0.##") ?? "-");
                    });

                    // Description
                    if (!string.IsNullOrWhiteSpace(description))
                    {
                        col.Item().PaddingTop(15).Text("설명").FontSize(12).Bold();
                        col.Item().PaddingTop(5).Text(description);
                    }

                    // Journals
                    if (issue.Journals.Count > 0)
                    {
                        col.Item().PaddingTop(15).Text("변경 이력").FontSize(12).Bold();

                        foreach (var journal in issue.Journals)
                        {
                            col.Item().PaddingTop(8).Column(jCol =>
                            {
                                var journalAuthor = FormatUserName(journal.User);
                                jCol.Item().Text($"{journalAuthor} - {journal.CreatedAt:yyyy-MM-dd HH:mm}")
                                    .FontSize(9).Bold();

                                foreach (var detail in journal.Details)
                                {
                                    jCol.Item().PaddingLeft(10).Text($"{detail.PropertyName}: {detail.OldValue ?? "(없음)"} → {detail.NewValue ?? "(없음)"}")
                                        .FontSize(9);
                                }

                                if (!string.IsNullOrWhiteSpace(journal.Notes))
                                {
                                    jCol.Item().PaddingLeft(10).Text(StripHtml(journal.Notes))
                                        .FontSize(9);
                                }
                            });
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Nexmine - ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> ExportIssueListToPdfAsync(string projectIdentifier, IssueFilterParams filter)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var query = _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
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

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.MarginHorizontal(30);
                page.MarginVertical(20);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text($"{project.Name} - 이슈 목록").FontSize(14).Bold();
                    col.Item().Text($"생성일: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC / {issues.Count}건")
                        .FontSize(8);
                });

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(40);   // #
                        columns.RelativeColumn(4);     // Subject
                        columns.RelativeColumn(1.2f);  // Tracker
                        columns.RelativeColumn(1.2f);  // Status
                        columns.RelativeColumn(1.2f);  // Priority
                        columns.RelativeColumn(1.5f);  // Assignee
                        columns.ConstantColumn(70);    // DueDate
                    });

                    // Header
                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("#").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("제목").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("트래커").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("상태").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("우선순위").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("담당자").Bold();
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text("기한").Bold();
                    });

                    // Data rows
                    foreach (var issue in issues)
                    {
                        var assignee = issue.AssignedTo is not null
                            ? FormatUserName(issue.AssignedTo)
                            : "-";

                        table.Cell().Padding(3).Text(issue.Id.ToString());
                        table.Cell().Padding(3).Text(issue.Subject);
                        table.Cell().Padding(3).Text(issue.Tracker.Name);
                        table.Cell().Padding(3).Text(issue.Status.Name);
                        table.Cell().Padding(3).Text(issue.Priority.Name);
                        table.Cell().Padding(3).Text(assignee);
                        table.Cell().Padding(3).Text(issue.DueDate?.ToString("yyyy-MM-dd") ?? "-");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Nexmine - ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void AddMetaRow(TableDescriptor table, string label1, string value1, string label2, string value2)
    {
        table.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(label1).Bold().FontSize(9);
        table.Cell().Padding(4).Text(value1).FontSize(9);
        table.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text(label2).Bold().FontSize(9);
        table.Cell().Padding(4).Text(value2).FontSize(9);
    }

    private static string FormatUserName(Domain.Entities.User user)
    {
        var name = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrEmpty(name) ? user.Username : name;
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html))
            return "";

        // Remove HTML tags
        var text = Regex.Replace(html, "<[^>]+>", " ");
        // Decode common HTML entities
        text = text.Replace("&amp;", "&")
                   .Replace("&lt;", "<")
                   .Replace("&gt;", ">")
                   .Replace("&quot;", "\"")
                   .Replace("&#39;", "'")
                   .Replace("&nbsp;", " ");
        // Collapse whitespace
        text = Regex.Replace(text, @"\s+", " ").Trim();
        return text;
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
