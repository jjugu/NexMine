using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Application.Features.Projects.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public ProjectService(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<PagedResult<ProjectDto>> ListAsync(int page, int pageSize, string? search)
    {
        var query = _dbContext.Projects.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Identifier.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ProjectDto>
        {
            Items = _mapper.Map<List<ProjectDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProjectDto?> GetByIdentifierAsync(string identifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        return project is null ? null : _mapper.Map<ProjectDto>(project);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId)
    {
        var exists = await _dbContext.Projects
            .AnyAsync(p => p.Identifier == request.Identifier);

        if (exists)
        {
            throw new InvalidOperationException("동일한 식별자의 프로젝트가 이미 존재합니다.");
        }

        var project = new Project
        {
            Name = request.Name,
            Identifier = request.Identifier,
            Description = request.Description,
            IsPublic = request.IsPublic
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();

        // Add creator as Manager
        var membership = new ProjectMembership
        {
            ProjectId = project.Id,
            UserId = userId,
            RoleId = 1 // Manager
        };

        _dbContext.ProjectMemberships.Add(membership);
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task<ProjectDto?> UpdateAsync(string identifier, UpdateProjectRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null)
        {
            return null;
        }

        if (request.Name is not null)
            project.Name = request.Name;

        if (request.Description is not null)
            project.Description = request.Description;

        if (request.IsPublic.HasValue)
            project.IsPublic = request.IsPublic.Value;

        if (request.IsArchived.HasValue)
            project.IsArchived = request.IsArchived.Value;

        await _dbContext.SaveChangesAsync();

        return _mapper.Map<ProjectDto>(project);
    }

    public async Task<bool> ArchiveAsync(string identifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null)
        {
            return false;
        }

        project.IsArchived = true;
        await _dbContext.SaveChangesAsync();

        return true;
    }
}
