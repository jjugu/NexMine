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

    private static readonly string[] AllModules =
    [
        "issues", "boards", "gantt", "calendar", "wiki",
        "documents", "news", "forums", "time_tracking", "roadmap", "activity"
    ];

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
            .Include(p => p.Modules)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(p =>
        {
            var dto = _mapper.Map<ProjectDto>(p);
            dto.EnabledModules = p.Modules.Select(m => m.ModuleName).ToList();
            return dto;
        }).ToList();

        return new PagedResult<ProjectDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProjectDto?> GetByIdentifierAsync(string identifier)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Modules)
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null) return null;

        var dto = _mapper.Map<ProjectDto>(project);
        dto.EnabledModules = project.Modules.Select(m => m.ModuleName).ToList();
        return dto;
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

        // Enable all modules by default
        foreach (var mod in AllModules)
        {
            _dbContext.ProjectModules.Add(new ProjectModule { ProjectId = project.Id, ModuleName = mod });
        }

        await _dbContext.SaveChangesAsync();

        var dto = _mapper.Map<ProjectDto>(project);
        dto.EnabledModules = AllModules.ToList();
        return dto;
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

    public async Task<ProjectModulesDto> GetModulesAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");
        }

        var enabledModules = await _dbContext.ProjectModules
            .Where(pm => pm.ProjectId == project.Id)
            .Select(pm => pm.ModuleName)
            .ToListAsync();

        return new ProjectModulesDto
        {
            EnabledModules = enabledModules,
            AllModules = AllModules.ToList()
        };
    }

    public async Task UpdateModulesAsync(string projectIdentifier, UpdateProjectModulesRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");
        }

        // Validate module names
        var invalidModules = request.EnabledModules.Except(AllModules).ToList();
        if (invalidModules.Count > 0)
        {
            throw new ArgumentException($"유효하지 않은 모듈: {string.Join(", ", invalidModules)}");
        }

        // Remove all existing modules
        var existing = await _dbContext.ProjectModules
            .Where(pm => pm.ProjectId == project.Id)
            .ToListAsync();

        _dbContext.ProjectModules.RemoveRange(existing);

        // Add new modules
        foreach (var mod in request.EnabledModules)
        {
            _dbContext.ProjectModules.Add(new ProjectModule { ProjectId = project.Id, ModuleName = mod });
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> IsModuleEnabledAsync(string projectIdentifier, string moduleName)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            return false;
        }

        return await _dbContext.ProjectModules
            .AnyAsync(pm => pm.ProjectId == project.Id && pm.ModuleName == moduleName);
    }
}
