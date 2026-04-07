using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Domain.Enums;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class IssueRelationService : IIssueRelationService
{
    private readonly NexmineDbContext _dbContext;

    public IssueRelationService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<IssueRelationDto>> ListByIssueAsync(int issueId)
    {
        var issue = await _dbContext.Issues.FindAsync(issueId)
            ?? throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var relations = await _dbContext.IssueRelations
            .Where(r => r.IssueFromId == issueId || r.IssueToId == issueId)
            .Select(r => new IssueRelationDto
            {
                Id = r.Id,
                IssueFromId = r.IssueFromId,
                IssueToId = r.IssueToId,
                RelationType = (int)r.RelationType,
                Delay = r.Delay
            })
            .ToListAsync();

        return relations;
    }

    public async Task<IssueRelationDto> CreateAsync(int issueId, CreateIssueRelationRequest request)
    {
        var issueFrom = await _dbContext.Issues.FindAsync(issueId)
            ?? throw new KeyNotFoundException("일감을 찾을 수 없습니다.");

        var issueTo = await _dbContext.Issues.FindAsync(request.IssueToId)
            ?? throw new KeyNotFoundException("대상 일감을 찾을 수 없습니다.");

        if (issueId == request.IssueToId)
            throw new InvalidOperationException("자기 자신과의 관계는 생성할 수 없습니다.");

        if (!Enum.IsDefined(typeof(IssueRelationType), request.RelationType))
            throw new InvalidOperationException("유효하지 않은 관계 유형입니다.");

        // Check for duplicate relation
        var exists = await _dbContext.IssueRelations
            .AnyAsync(r => r.IssueFromId == issueId && r.IssueToId == request.IssueToId
                        && r.RelationType == (IssueRelationType)request.RelationType);

        if (exists)
            throw new InvalidOperationException("이미 동일한 관계가 존재합니다.");

        var relation = new IssueRelation
        {
            IssueFromId = issueId,
            IssueToId = request.IssueToId,
            RelationType = (IssueRelationType)request.RelationType,
            Delay = request.Delay
        };

        _dbContext.IssueRelations.Add(relation);
        await _dbContext.SaveChangesAsync();

        return new IssueRelationDto
        {
            Id = relation.Id,
            IssueFromId = relation.IssueFromId,
            IssueToId = relation.IssueToId,
            RelationType = (int)relation.RelationType,
            Delay = relation.Delay
        };
    }

    public async Task<bool> DeleteAsync(int issueId, int relationId)
    {
        var relation = await _dbContext.IssueRelations
            .FirstOrDefaultAsync(r => r.Id == relationId
                && (r.IssueFromId == issueId || r.IssueToId == issueId));

        if (relation is null)
            return false;

        _dbContext.IssueRelations.Remove(relation);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
