using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Integrations.Interfaces;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Application.Features.Realtime.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class JournalService : IJournalService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IRealtimeNotificationService _realtimeNotificationService;
    private readonly IGoogleChatService _googleChatService;

    public JournalService(
        NexmineDbContext dbContext,
        IRealtimeNotificationService realtimeNotificationService,
        IGoogleChatService googleChatService)
    {
        _dbContext = dbContext;
        _realtimeNotificationService = realtimeNotificationService;
        _googleChatService = googleChatService;
    }

    public async Task<List<JournalDto>> ListByIssueAsync(int issueId)
    {
        var issueExists = await _dbContext.Issues.AnyAsync(i => i.Id == issueId);
        if (!issueExists)
            throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var journals = await _dbContext.Journals
            .Include(j => j.User)
            .Include(j => j.Details)
            .Where(j => j.IssueId == issueId)
            .OrderBy(j => j.CreatedAt)
            .ToListAsync();

        return journals.Select(j => new JournalDto
        {
            Id = j.Id,
            UserName = $"{j.User.FirstName} {j.User.LastName}".Trim(),
            Notes = j.Notes,
            CreatedAt = j.CreatedAt,
            Details = j.Details.Select(d => new JournalDetailDto
            {
                PropertyName = d.PropertyName,
                OldValue = d.OldValue,
                NewValue = d.NewValue
            }).ToList()
        }).ToList();
    }

    public async Task<JournalDto> AddJournalAsync(int issueId, CreateJournalRequest request, int userId)
    {
        var issueExists = await _dbContext.Issues.AnyAsync(i => i.Id == issueId);
        if (!issueExists)
            throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var journal = new Journal
        {
            IssueId = issueId,
            UserId = userId,
            Notes = request.Notes
        };

        _dbContext.Journals.Add(journal);
        await _dbContext.SaveChangesAsync();

        var user = await _dbContext.Users.FindAsync(userId);

        var userName = $"{user!.FirstName} {user.LastName}".Trim();

        // Send realtime notifications
        var issue = await _dbContext.Issues
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Id == issueId);
        if (issue is not null)
        {
            await _realtimeNotificationService.NotifyIssueCommentedAsync(
                issue.Project.Identifier, issueId, issue.Subject, userName, request.Notes);
            await _realtimeNotificationService.NotifyIssueChangedAsync(issueId, userName);

            // Google Chat webhook notification (fire-and-forget)
            _ = _googleChatService.SendMessageAsync(issue.ProjectId,
                $"\ud83d\udcac *댓글* #{issueId} {issue.Subject}\n\ud83d\udc64 {userName}\n{request.Notes}");
        }

        return new JournalDto
        {
            Id = journal.Id,
            UserName = userName,
            Notes = journal.Notes,
            CreatedAt = journal.CreatedAt,
            Details = []
        };
    }
}
