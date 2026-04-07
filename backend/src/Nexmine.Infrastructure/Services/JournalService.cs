using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class JournalService : IJournalService
{
    private readonly NexmineDbContext _dbContext;

    public JournalService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
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

        return new JournalDto
        {
            Id = journal.Id,
            UserName = $"{user!.FirstName} {user.LastName}".Trim(),
            Notes = journal.Notes,
            CreatedAt = journal.CreatedAt,
            Details = []
        };
    }
}
