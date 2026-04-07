using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AdminPriorityService : IAdminPriorityService
{
    private readonly NexmineDbContext _dbContext;

    public AdminPriorityService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminPriorityDto>> ListAsync()
    {
        return await _dbContext.IssuePriorities
            .OrderBy(p => p.Position)
            .Select(p => new AdminPriorityDto
            {
                Id = p.Id,
                Name = p.Name,
                IsDefault = p.IsDefault,
                Position = p.Position
            })
            .ToListAsync();
    }

    public async Task<AdminPriorityDto> CreateAsync(CreatePriorityRequest request)
    {
        var priority = new IssuePriority
        {
            Name = request.Name,
            IsDefault = request.IsDefault ?? false,
            Position = request.Position ?? 0
        };

        if (priority.IsDefault)
        {
            await _dbContext.IssuePriorities.Where(p => p.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(p => p.IsDefault, false));
        }

        _dbContext.IssuePriorities.Add(priority);
        await _dbContext.SaveChangesAsync();

        return new AdminPriorityDto
        {
            Id = priority.Id,
            Name = priority.Name,
            IsDefault = priority.IsDefault,
            Position = priority.Position
        };
    }

    public async Task<AdminPriorityDto?> UpdateAsync(int id, UpdatePriorityRequest request)
    {
        var priority = await _dbContext.IssuePriorities.FindAsync(id);
        if (priority is null) return null;

        if (request.Name is not null) priority.Name = request.Name;
        if (request.IsDefault.HasValue)
        {
            priority.IsDefault = request.IsDefault.Value;
            if (priority.IsDefault)
            {
                await _dbContext.IssuePriorities.Where(p => p.Id != id && p.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(p => p.IsDefault, false));
            }
        }
        if (request.Position.HasValue) priority.Position = request.Position.Value;

        await _dbContext.SaveChangesAsync();

        return new AdminPriorityDto
        {
            Id = priority.Id,
            Name = priority.Name,
            IsDefault = priority.IsDefault,
            Position = priority.Position
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var priority = await _dbContext.IssuePriorities.FindAsync(id);
        if (priority is null) return false;

        var hasIssues = await _dbContext.Issues.AnyAsync(i => i.PriorityId == id);
        if (hasIssues)
        {
            throw new InvalidOperationException("이 우선순위를 사용하는 이슈가 있어 삭제할 수 없습니다.");
        }

        _dbContext.IssuePriorities.Remove(priority);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
