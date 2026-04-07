using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class IssueCategoryService : IIssueCategoryService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public IssueCategoryService(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<List<IssueCategoryDto>> ListByProjectAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var categories = await _dbContext.IssueCategories
            .Where(c => c.ProjectId == project.Id)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return _mapper.Map<List<IssueCategoryDto>>(categories);
    }

    public async Task<IssueCategoryDto> CreateAsync(string projectIdentifier, CreateIssueCategoryRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var category = new IssueCategory
        {
            ProjectId = project.Id,
            Name = request.Name
        };

        _dbContext.IssueCategories.Add(category);
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<IssueCategoryDto>(category);
    }

    public async Task<IssueCategoryDto?> UpdateAsync(int id, UpdateIssueCategoryRequest request)
    {
        var category = await _dbContext.IssueCategories.FindAsync(id);
        if (category is null)
            return null;

        if (request.Name is not null)
            category.Name = request.Name;

        await _dbContext.SaveChangesAsync();

        return _mapper.Map<IssueCategoryDto>(category);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _dbContext.IssueCategories.FindAsync(id);
        if (category is null)
            return false;

        _dbContext.IssueCategories.Remove(category);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
