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

    public async Task<PagedResult<ProjectDto>> ListAsync(int page, int pageSize, string? search, int? userId = null)
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

        // Get favorite project IDs for the user
        var favoriteProjectIds = userId.HasValue
            ? (await _dbContext.ProjectFavorites
                .Where(pf => pf.UserId == userId.Value)
                .Select(pf => pf.ProjectId)
                .ToListAsync())
                .ToHashSet()
            : new HashSet<int>();

        var dtos = items.Select(p =>
        {
            var dto = _mapper.Map<ProjectDto>(p);
            dto.EnabledModules = p.Modules.Where(m => m.ModuleName != "_configured").Select(m => m.ModuleName).ToList();
            dto.IsFavorite = favoriteProjectIds.Contains(p.Id);
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

    public async Task<ProjectDto?> GetByIdentifierAsync(string identifier, int? userId = null)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Modules)
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null) return null;

        var dto = _mapper.Map<ProjectDto>(project);
        var modules = project.Modules.Select(m => m.ModuleName).ToList();
        dto.EnabledModules = modules.Count > 0 ? modules : AllModules.ToList();

        if (userId.HasValue)
        {
            dto.IsFavorite = await _dbContext.ProjectFavorites
                .AnyAsync(pf => pf.UserId == userId.Value && pf.ProjectId == project.Id);
        }

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

        var hasAnyModuleRecord = await _dbContext.ProjectModules
            .AnyAsync(pm => pm.ProjectId == project.Id);

        if (!hasAnyModuleRecord)
        {
            // First access for legacy project: auto-insert all defaults
            foreach (var mod in AllModules)
                _dbContext.ProjectModules.Add(new ProjectModule { ProjectId = project.Id, ModuleName = mod });
            await _dbContext.SaveChangesAsync();
        }

        var enabledModules = await _dbContext.ProjectModules
            .Where(pm => pm.ProjectId == project.Id && pm.ModuleName != "_configured")
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

        // Add enabled modules + marker to indicate modules have been configured
        _dbContext.ProjectModules.Add(new ProjectModule { ProjectId = project.Id, ModuleName = "_configured" });
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

    public async Task<bool> AddFavoriteAsync(string identifier, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null) return false;

        var exists = await _dbContext.ProjectFavorites
            .AnyAsync(pf => pf.UserId == userId && pf.ProjectId == project.Id);

        if (exists) return true; // Already a favorite, idempotent

        _dbContext.ProjectFavorites.Add(new ProjectFavorite
        {
            UserId = userId,
            ProjectId = project.Id
        });

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveFavoriteAsync(string identifier, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == identifier);

        if (project is null) return false;

        var favorite = await _dbContext.ProjectFavorites
            .FirstOrDefaultAsync(pf => pf.UserId == userId && pf.ProjectId == project.Id);

        if (favorite is null) return true; // Already not a favorite, idempotent

        _dbContext.ProjectFavorites.Remove(favorite);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProjectDto>> GetFavoritesAsync(int userId)
    {
        var favorites = await _dbContext.ProjectFavorites
            .Where(pf => pf.UserId == userId)
            .Include(pf => pf.Project)
                .ThenInclude(p => p.Modules)
            .Select(pf => pf.Project)
            .Where(p => !p.IsArchived)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return favorites.Select(p =>
        {
            var dto = _mapper.Map<ProjectDto>(p);
            dto.EnabledModules = p.Modules
                .Where(m => m.ModuleName != "_configured")
                .Select(m => m.ModuleName)
                .ToList();
            dto.IsFavorite = true;
            return dto;
        }).ToList();
    }

    public async Task<ProjectDto> CopyProjectAsync(string sourceIdentifier, CopyProjectRequest request, int userId)
    {
        // 1. Validate identifier uniqueness
        var identifierExists = await _dbContext.Projects
            .AnyAsync(p => p.Identifier == request.Identifier);

        if (identifierExists)
        {
            throw new InvalidOperationException("동일한 식별자의 프로젝트가 이미 존재합니다.");
        }

        // 2. Load source project with related data
        var source = await _dbContext.Projects
            .Include(p => p.Modules)
            .Include(p => p.Members)
            .Include(p => p.Categories)
            .Include(p => p.Versions)
            .Include(p => p.WikiPages)
            .Include(p => p.Issues)
            .FirstOrDefaultAsync(p => p.Identifier == sourceIdentifier);

        if (source is null)
        {
            throw new KeyNotFoundException($"원본 프로젝트 '{sourceIdentifier}'를 찾을 수 없습니다.");
        }

        // 3. Create new project
        var newProject = new Project
        {
            Name = request.Name,
            Identifier = request.Identifier,
            Description = request.Description ?? source.Description,
            IsPublic = request.IsPublic
        };

        _dbContext.Projects.Add(newProject);
        await _dbContext.SaveChangesAsync();

        // Always add the current user as Manager
        _dbContext.ProjectMemberships.Add(new ProjectMembership
        {
            ProjectId = newProject.Id,
            UserId = userId,
            RoleId = 1 // Manager
        });

        // 4. Copy modules
        if (request.CopyModules && source.Modules.Count > 0)
        {
            foreach (var mod in source.Modules)
            {
                _dbContext.ProjectModules.Add(new ProjectModule
                {
                    ProjectId = newProject.Id,
                    ModuleName = mod.ModuleName
                });
            }
        }
        else
        {
            // Enable all modules by default
            foreach (var mod in AllModules)
            {
                _dbContext.ProjectModules.Add(new ProjectModule
                {
                    ProjectId = newProject.Id,
                    ModuleName = mod
                });
            }
        }

        // 5. Copy members (excluding the current user who is already added as Manager)
        if (request.CopyMembers)
        {
            foreach (var member in source.Members.Where(m => m.UserId != userId))
            {
                _dbContext.ProjectMemberships.Add(new ProjectMembership
                {
                    ProjectId = newProject.Id,
                    UserId = member.UserId,
                    RoleId = member.RoleId
                });
            }
        }

        // 6. Copy versions
        if (request.CopyVersions)
        {
            foreach (var version in source.Versions)
            {
                _dbContext.Versions.Add(new Domain.Entities.Version
                {
                    ProjectId = newProject.Id,
                    Name = version.Name,
                    Description = version.Description,
                    Status = version.Status,
                    DueDate = version.DueDate
                });
            }
        }

        // 7. Copy categories
        if (request.CopyCategories)
        {
            foreach (var category in source.Categories)
            {
                _dbContext.IssueCategories.Add(new IssueCategory
                {
                    ProjectId = newProject.Id,
                    Name = category.Name
                });
            }
        }

        // 8. Copy wiki pages (flat copy, preserving tree structure via slug mapping)
        if (request.CopyWiki)
        {
            // Build a mapping from old page Id to new page entity for parent references
            var wikiPageMap = new Dictionary<int, WikiPage>();

            // First pass: copy root pages (no parent)
            foreach (var page in source.WikiPages.Where(p => p.ParentPageId == null))
            {
                var newPage = new WikiPage
                {
                    ProjectId = newProject.Id,
                    Title = page.Title,
                    Slug = page.Slug,
                    ContentHtml = page.ContentHtml,
                    AuthorId = userId,
                    Version = 1
                };
                _dbContext.WikiPages.Add(newPage);
                wikiPageMap[page.Id] = newPage;
            }

            await _dbContext.SaveChangesAsync();

            // Second pass: copy child pages
            foreach (var page in source.WikiPages.Where(p => p.ParentPageId != null))
            {
                var newPage = new WikiPage
                {
                    ProjectId = newProject.Id,
                    ParentPageId = wikiPageMap.ContainsKey(page.ParentPageId!.Value)
                        ? wikiPageMap[page.ParentPageId.Value].Id
                        : null,
                    Title = page.Title,
                    Slug = page.Slug,
                    ContentHtml = page.ContentHtml,
                    AuthorId = userId,
                    Version = 1
                };
                _dbContext.WikiPages.Add(newPage);
                wikiPageMap[page.Id] = newPage;
            }
        }

        // 9. Copy issues
        if (request.CopyIssues)
        {
            foreach (var issue in source.Issues)
            {
                _dbContext.Issues.Add(new Issue
                {
                    ProjectId = newProject.Id,
                    TrackerId = issue.TrackerId,
                    StatusId = 1, // Always New
                    PriorityId = issue.PriorityId,
                    AuthorId = userId,
                    Subject = issue.Subject,
                    Description = issue.Description,
                    DoneRatio = 0,
                    Position = issue.Position
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        // 10. Return the new project as DTO
        var enabledModules = await _dbContext.ProjectModules
            .Where(pm => pm.ProjectId == newProject.Id && pm.ModuleName != "_configured")
            .Select(pm => pm.ModuleName)
            .ToListAsync();

        var dto = _mapper.Map<ProjectDto>(newProject);
        dto.EnabledModules = enabledModules;
        return dto;
    }
}
