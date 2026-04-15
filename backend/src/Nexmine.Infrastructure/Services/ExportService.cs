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

        // systemd ProtectSystem=strict 환경에서 기본 temp 경로 접근 불가 대응
        var tempPath = Path.Combine(Path.GetTempPath(), "questpdf");
        if (!Directory.Exists(tempPath))
            try { Directory.CreateDirectory(tempPath); } catch { /* ignore */ }
        if (Directory.Exists(tempPath))
            QuestPDF.Settings.TemporaryStoragePath = tempPath;
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

        if (filter.TrackerId is { Length: > 0 })
            query = query.Where(i => filter.TrackerId.Contains(i.TrackerId));

        if (filter.StatusId is { Length: > 0 })
            query = query.Where(i => filter.StatusId.Contains(i.StatusId));

        if (filter.PriorityId is { Length: > 0 })
            query = query.Where(i => filter.PriorityId.Contains(i.PriorityId));

        if (filter.CategoryId.HasValue)
            query = query.Where(i => i.CategoryId == filter.CategoryId.Value);

        if (filter.VersionId.HasValue)
            query = query.Where(i => i.VersionId == filter.VersionId.Value);

        if (filter.AssignedToId.HasValue)
        {
            query = filter.AssignedToId.Value == 0
                ? query.Where(i => i.AssignedToId == null)
                : query.Where(i => i.AssignedToId == filter.AssignedToId.Value);
        }

        if (filter.AuthorId.HasValue)
            query = query.Where(i => i.AuthorId == filter.AuthorId.Value);

        if (filter.ParentIssueId.HasValue)
            query = query.Where(i => i.ParentIssueId == filter.ParentIssueId.Value);

        if (filter.IsPrivate.HasValue)
            query = query.Where(i => i.IsPrivate == filter.IsPrivate.Value);

        if (filter.IsClosed.HasValue)
            query = query.Where(i => i.Status.IsClosed == filter.IsClosed.Value);

        if (filter.StartDateFrom.HasValue)
            query = query.Where(i => i.StartDate.HasValue && i.StartDate.Value >= filter.StartDateFrom.Value);

        if (filter.StartDateTo.HasValue)
            query = query.Where(i => i.StartDate.HasValue && i.StartDate.Value <= filter.StartDateTo.Value);

        if (filter.DueDateFrom.HasValue)
            query = query.Where(i => i.DueDate.HasValue && i.DueDate.Value >= filter.DueDateFrom.Value);

        if (filter.DueDateTo.HasValue)
            query = query.Where(i => i.DueDate.HasValue && i.DueDate.Value <= filter.DueDateTo.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Subject.ToLower().Contains(term) ||
                (i.Description != null && i.Description.ToLower().Contains(term)));
        }

        var sortDescending = filter.IsSortDescending;

        query = filter.SortBy?.ToLower() switch
        {
            "subject" => sortDescending ? query.OrderByDescending(i => i.Subject) : query.OrderBy(i => i.Subject),
            "status" or "statusname" => sortDescending ? query.OrderByDescending(i => i.Status.Position) : query.OrderBy(i => i.Status.Position),
            "priority" or "priorityname" => sortDescending ? query.OrderByDescending(i => i.Priority.Position) : query.OrderBy(i => i.Priority.Position),
            "tracker" or "trackername" => sortDescending ? query.OrderByDescending(i => i.Tracker.Position) : query.OrderBy(i => i.Tracker.Position),
            "assignee" or "assignedtoname" => sortDescending
                ? query.OrderByDescending(i => i.AssignedToId == null).ThenByDescending(i => i.AssignedTo != null ? i.AssignedTo.Username : string.Empty)
                : query.OrderBy(i => i.AssignedToId == null).ThenBy(i => i.AssignedTo != null ? i.AssignedTo.Username : string.Empty),
            "doneratio" => sortDescending ? query.OrderByDescending(i => i.DoneRatio) : query.OrderBy(i => i.DoneRatio),
            "updated" or "updatedat" => sortDescending ? query.OrderByDescending(i => i.UpdatedAt) : query.OrderBy(i => i.UpdatedAt),
            "createdat" => sortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt),
            _ => sortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt)
        };

        var issues = await query
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
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Noto Sans CJK KR"));

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

        if (filter.TrackerId is { Length: > 0 })
            query = query.Where(i => filter.TrackerId.Contains(i.TrackerId));

        if (filter.StatusId is { Length: > 0 })
            query = query.Where(i => filter.StatusId.Contains(i.StatusId));

        if (filter.PriorityId is { Length: > 0 })
            query = query.Where(i => filter.PriorityId.Contains(i.PriorityId));

        if (filter.CategoryId.HasValue)
            query = query.Where(i => i.CategoryId == filter.CategoryId.Value);

        if (filter.VersionId.HasValue)
            query = query.Where(i => i.VersionId == filter.VersionId.Value);

        if (filter.AssignedToId.HasValue)
        {
            query = filter.AssignedToId.Value == 0
                ? query.Where(i => i.AssignedToId == null)
                : query.Where(i => i.AssignedToId == filter.AssignedToId.Value);
        }

        if (filter.AuthorId.HasValue)
            query = query.Where(i => i.AuthorId == filter.AuthorId.Value);

        if (filter.ParentIssueId.HasValue)
            query = query.Where(i => i.ParentIssueId == filter.ParentIssueId.Value);

        if (filter.IsPrivate.HasValue)
            query = query.Where(i => i.IsPrivate == filter.IsPrivate.Value);

        if (filter.IsClosed.HasValue)
            query = query.Where(i => i.Status.IsClosed == filter.IsClosed.Value);

        if (filter.StartDateFrom.HasValue)
            query = query.Where(i => i.StartDate.HasValue && i.StartDate.Value >= filter.StartDateFrom.Value);

        if (filter.StartDateTo.HasValue)
            query = query.Where(i => i.StartDate.HasValue && i.StartDate.Value <= filter.StartDateTo.Value);

        if (filter.DueDateFrom.HasValue)
            query = query.Where(i => i.DueDate.HasValue && i.DueDate.Value >= filter.DueDateFrom.Value);

        if (filter.DueDateTo.HasValue)
            query = query.Where(i => i.DueDate.HasValue && i.DueDate.Value <= filter.DueDateTo.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Subject.ToLower().Contains(term) ||
                (i.Description != null && i.Description.ToLower().Contains(term)));
        }

        var sortDescending = filter.IsSortDescending;

        query = filter.SortBy?.ToLower() switch
        {
            "subject" => sortDescending ? query.OrderByDescending(i => i.Subject) : query.OrderBy(i => i.Subject),
            "status" or "statusname" => sortDescending ? query.OrderByDescending(i => i.Status.Position) : query.OrderBy(i => i.Status.Position),
            "priority" or "priorityname" => sortDescending ? query.OrderByDescending(i => i.Priority.Position) : query.OrderBy(i => i.Priority.Position),
            "tracker" or "trackername" => sortDescending ? query.OrderByDescending(i => i.Tracker.Position) : query.OrderBy(i => i.Tracker.Position),
            "assignee" or "assignedtoname" => sortDescending
                ? query.OrderByDescending(i => i.AssignedToId == null).ThenByDescending(i => i.AssignedTo != null ? i.AssignedTo.Username : string.Empty)
                : query.OrderBy(i => i.AssignedToId == null).ThenBy(i => i.AssignedTo != null ? i.AssignedTo.Username : string.Empty),
            "doneratio" => sortDescending ? query.OrderByDescending(i => i.DoneRatio) : query.OrderBy(i => i.DoneRatio),
            "updated" or "updatedat" => sortDescending ? query.OrderByDescending(i => i.UpdatedAt) : query.OrderBy(i => i.UpdatedAt),
            "createdat" => sortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt),
            _ => sortDescending ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt)
        };

        var issues = await query
            .Take(MaxExportRows)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.MarginHorizontal(30);
                page.MarginVertical(20);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Noto Sans CJK KR"));

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

    public async Task<byte[]> ExportGanttToPdfAsync(string projectIdentifier, string viewMode)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var issues = await _dbContext.Issues
            .Include(i => i.Tracker)
            .Include(i => i.Status)
            .Include(i => i.Priority)
            .Include(i => i.AssignedTo)
            .Where(i => i.ProjectId == project.Id)
            .Where(i => i.StartDate != null && i.DueDate != null)
            .OrderBy(i => i.StartDate)
            .ThenBy(i => i.Id)
            .Take(MaxExportRows)
            .ToListAsync();

        if (issues.Count == 0)
        {
            throw new InvalidOperationException("내보낼 간트 이슈가 없습니다. 시작일과 종료일이 설정된 이슈가 필요합니다.");
        }

        var minDate = issues.Min(i => i.StartDate!.Value);
        var maxDate = issues.Max(i => i.DueDate!.Value);
        // Add 1 week padding on each side
        var chartStart = minDate.AddDays(-7);
        var chartEnd = maxDate.AddDays(7);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var totalDays = chartEnd.DayNumber - chartStart.DayNumber + 1;

        // Tracker colors - ID/index 기반 팔레트 (이름 변경에 영향 없음)
        var colorPalette = new[]
        {
            Color.FromHex("#ef5350"), // 빨강
            Color.FromHex("#42a5f5"), // 파랑
            Color.FromHex("#66bb6a"), // 초록
            Color.FromHex("#ffa726"), // 주황
            Color.FromHex("#ab47bc"), // 보라
            Color.FromHex("#26c6da"), // 청록
            Color.FromHex("#ec407a"), // 분홍
            Color.FromHex("#8d6e63"), // 갈색
        };
        var trackerColorMap = issues
            .Select(i => i.Tracker?.Id ?? 0)
            .Distinct()
            .Order()
            .Select((id, idx) => (id, color: colorPalette[idx % colorPalette.Length]))
            .ToDictionary(x => x.id, x => x.color);
        var defaultBarColor = Color.FromHex("#90a4ae");
        var progressBarColor = Color.FromHex("#1b5e20");

        // Build date columns for the gantt chart table
        var dateColumns = BuildDateColumns(chartStart, chartEnd, viewMode);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A3.Landscape());
                page.MarginHorizontal(20);
                page.MarginVertical(15);
                page.DefaultTextStyle(x => x.FontSize(8).FontFamily("Noto Sans CJK KR"));

                page.Header().Column(col =>
                {
                    col.Item().Text($"{project.Name} - 간트 차트").FontSize(14).Bold();
                    col.Item().Text($"생성일: {DateTime.UtcNow:yyyy-MM-dd} / {issues.Count}건 / 뷰: {viewMode}")
                        .FontSize(8);
                    col.Item().PaddingBottom(5);
                });

                page.Content().Table(table =>
                {
                    // Define columns: # | Subject | Assignee | Duration | [date columns...]
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);   // #
                        columns.ConstantColumn(130);  // Subject
                        columns.ConstantColumn(60);   // Assignee
                        columns.ConstantColumn(40);   // Duration
                        foreach (var _ in dateColumns)
                        {
                            columns.ConstantColumn(dateColumns.Count > 60 ? 8 : dateColumns.Count > 30 ? 12 : 18);
                        }
                    });

                    // Header row
                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(2).AlignMiddle().Text("#").Bold().FontSize(7);
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(2).AlignMiddle().Text("제목").Bold().FontSize(7);
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(2).AlignMiddle().Text("담당자").Bold().FontSize(7);
                        header.Cell().Background(Colors.Grey.Lighten2).Padding(2).AlignMiddle().Text("기간").Bold().FontSize(7);

                        foreach (var dc in dateColumns)
                        {
                            var bgColor = dc.IsToday ? Color.FromHex("#ffcdd2") :
                                          dc.IsWeekend ? Colors.Grey.Lighten3 :
                                          Colors.Grey.Lighten2;

                            header.Cell().Background(bgColor).Padding(1).AlignMiddle().AlignCenter()
                                .Text(dc.Label).FontSize(5);
                        }
                    });

                    // Data rows
                    foreach (var issue in issues)
                    {
                        var assignee = issue.AssignedTo is not null
                            ? FormatUserName(issue.AssignedTo)
                            : "-";
                        var subject = issue.Subject.Length > 25
                            ? issue.Subject[..25] + "..."
                            : issue.Subject;
                        var durationDays = issue.DueDate!.Value.DayNumber - issue.StartDate!.Value.DayNumber + 1;

                        var trackerId = issue.Tracker?.Id ?? 0;
                        var barColor = trackerColorMap.GetValueOrDefault(trackerId, defaultBarColor);

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).AlignMiddle()
                            .Text(issue.Id.ToString()).FontSize(7);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).AlignMiddle()
                            .Text(subject).FontSize(7);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).AlignMiddle()
                            .Text(assignee).FontSize(7);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(2).AlignMiddle()
                            .Text($"{durationDays}일").FontSize(7);

                        // Gantt bar cells
                        foreach (var dc in dateColumns)
                        {
                            var cell = table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2);

                            var isInRange = dc.StartDate <= issue.DueDate!.Value && dc.EndDate >= issue.StartDate!.Value;

                            if (isInRange)
                            {
                                // Calculate progress within this cell
                                var cellDays = dc.EndDate.DayNumber - dc.StartDate.DayNumber + 1;
                                var overlapStart = dc.StartDate > issue.StartDate.Value ? dc.StartDate : issue.StartDate.Value;
                                var overlapEnd = dc.EndDate < issue.DueDate.Value ? dc.EndDate : issue.DueDate.Value;

                                if (issue.DoneRatio > 0)
                                {
                                    // Show bar with progress
                                    cell.Column(barCol =>
                                    {
                                        barCol.Item().Height(10).Background(barColor);
                                        barCol.Item().Height(4).Row(progressRow =>
                                        {
                                            if (issue.DoneRatio > 0)
                                            {
                                                progressRow.RelativeItem(issue.DoneRatio).Background(progressBarColor);
                                            }
                                            if (issue.DoneRatio < 100)
                                            {
                                                progressRow.RelativeItem(100 - issue.DoneRatio).Background(Colors.Grey.Lighten2);
                                            }
                                        });
                                    });
                                }
                                else
                                {
                                    cell.Height(14).Background(barColor);
                                }
                            }
                            else if (dc.IsToday)
                            {
                                cell.Height(14).BorderLeft(1).BorderColor(Color.FromHex("#f44336"));
                            }
                            else if (dc.IsWeekend)
                            {
                                cell.Height(14).Background(Colors.Grey.Lighten4);
                            }
                            else
                            {
                                cell.Height(14);
                            }
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

    private static List<GanttDateColumn> BuildDateColumns(DateOnly chartStart, DateOnly chartEnd, string viewMode)
    {
        var columns = new List<GanttDateColumn>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (viewMode == "week")
        {
            // Align to Monday
            var d = chartStart;
            while (d.DayOfWeek != DayOfWeek.Monday)
                d = d.AddDays(-1);

            while (d <= chartEnd)
            {
                var weekEnd = d.AddDays(6);
                var weekNum = System.Globalization.ISOWeek.GetWeekOfYear(d.ToDateTime(TimeOnly.MinValue));
                columns.Add(new GanttDateColumn
                {
                    Label = $"W{weekNum}",
                    StartDate = d,
                    EndDate = weekEnd,
                    IsToday = today >= d && today <= weekEnd,
                    IsWeekend = false,
                });
                d = d.AddDays(7);
            }
        }
        else if (viewMode == "month")
        {
            var d = new DateOnly(chartStart.Year, chartStart.Month, 1);
            while (d <= chartEnd)
            {
                var monthEnd = d.AddMonths(1).AddDays(-1);
                columns.Add(new GanttDateColumn
                {
                    Label = d.ToString("yy/M"),
                    StartDate = d,
                    EndDate = monthEnd,
                    IsToday = today >= d && today <= monthEnd,
                    IsWeekend = false,
                });
                d = d.AddMonths(1);
            }
        }
        else // day
        {
            for (var d = chartStart; d <= chartEnd; d = d.AddDays(1))
            {
                columns.Add(new GanttDateColumn
                {
                    Label = d.ToString("d"),
                    StartDate = d,
                    EndDate = d,
                    IsToday = d == today,
                    IsWeekend = d.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday,
                });
            }
        }

        return columns;
    }

    private sealed class GanttDateColumn
    {
        public required string Label { get; init; }
        public required DateOnly StartDate { get; init; }
        public required DateOnly EndDate { get; init; }
        public required bool IsToday { get; init; }
        public required bool IsWeekend { get; init; }
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
