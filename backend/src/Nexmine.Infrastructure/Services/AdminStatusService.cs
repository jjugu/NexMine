using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AdminStatusService : IAdminStatusService
{
    private readonly NexmineDbContext _dbContext;

    public AdminStatusService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminStatusDto>> ListAsync()
    {
        return await _dbContext.IssueStatuses
            .OrderBy(s => s.Position)
            .Select(s => new AdminStatusDto
            {
                Id = s.Id,
                Name = s.Name,
                IsClosed = s.IsClosed,
                Position = s.Position
            })
            .ToListAsync();
    }

    public async Task<AdminStatusDto> CreateAsync(CreateStatusRequest request)
    {
        var status = new IssueStatus
        {
            Name = request.Name,
            IsClosed = request.IsClosed ?? false,
            Position = request.Position ?? 0
        };

        _dbContext.IssueStatuses.Add(status);
        await _dbContext.SaveChangesAsync();

        return new AdminStatusDto
        {
            Id = status.Id,
            Name = status.Name,
            IsClosed = status.IsClosed,
            Position = status.Position
        };
    }

    public async Task<AdminStatusDto?> UpdateAsync(int id, UpdateStatusRequest request)
    {
        var status = await _dbContext.IssueStatuses.FindAsync(id);
        if (status is null) return null;

        if (request.Name is not null) status.Name = request.Name;
        if (request.IsClosed.HasValue) status.IsClosed = request.IsClosed.Value;
        if (request.Position.HasValue) status.Position = request.Position.Value;

        await _dbContext.SaveChangesAsync();

        return new AdminStatusDto
        {
            Id = status.Id,
            Name = status.Name,
            IsClosed = status.IsClosed,
            Position = status.Position
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var status = await _dbContext.IssueStatuses.FindAsync(id);
        if (status is null) return false;

        var hasIssues = await _dbContext.Issues.AnyAsync(i => i.StatusId == id);
        if (hasIssues)
        {
            throw new InvalidOperationException("이 상태를 사용하는 이슈가 있어 삭제할 수 없습니다.");
        }

        _dbContext.IssueStatuses.Remove(status);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
