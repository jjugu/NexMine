using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Wiki.Dtos;
using Nexmine.Application.Features.Wiki.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class WikiService : IWikiService
{
    private readonly NexmineDbContext _dbContext;

    public WikiService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<WikiPageDto>> ListAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var pages = await _dbContext.WikiPages
            .Include(w => w.Author)
            .Where(w => w.ProjectId == project.Id)
            .OrderBy(w => w.Title)
            .ToListAsync();

        return pages.Select(MapToDto).ToList();
    }

    public async Task<WikiPageDetailDto?> GetBySlugAsync(string projectIdentifier, string slug)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var page = await _dbContext.WikiPages
            .Include(w => w.Author)
            .Include(w => w.Children)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.Slug == slug);

        if (page is null)
            return null;

        return MapToDetailDto(page);
    }

    public async Task<WikiPageDetailDto> CreateAsync(string projectIdentifier, CreateWikiPageRequest request, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var slug = GenerateSlug(request.Title);

        // Check for duplicate slug
        var existingSlug = await _dbContext.WikiPages
            .AnyAsync(w => w.ProjectId == project.Id && w.Slug == slug);
        if (existingSlug)
            throw new InvalidOperationException($"동일한 슬러그 '{slug}'의 위키 페이지가 이미 존재합니다.");

        if (request.ParentPageId.HasValue)
        {
            var parentExists = await _dbContext.WikiPages
                .AnyAsync(w => w.Id == request.ParentPageId.Value && w.ProjectId == project.Id);
            if (!parentExists)
                throw new KeyNotFoundException("상위 위키 페이지를 찾을 수 없습니다.");
        }

        var page = new WikiPage
        {
            ProjectId = project.Id,
            ParentPageId = request.ParentPageId,
            Title = request.Title,
            Slug = slug,
            ContentHtml = request.ContentHtml,
            AuthorId = userId,
            Version = 1
        };

        _dbContext.WikiPages.Add(page);

        // Create initial version snapshot
        var version = new WikiPageVersion
        {
            WikiPage = page,
            Version = 1,
            Title = request.Title,
            ContentHtml = request.ContentHtml,
            EditedByUserId = userId,
            Comments = null
        };

        _dbContext.WikiPageVersions.Add(version);
        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties
        var created = await _dbContext.WikiPages
            .Include(w => w.Author)
            .Include(w => w.Children)
                .ThenInclude(c => c.Author)
            .FirstAsync(w => w.Id == page.Id);

        return MapToDetailDto(created);
    }

    public async Task<WikiPageDetailDto?> UpdateAsync(string projectIdentifier, string slug, UpdateWikiPageRequest request, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var page = await _dbContext.WikiPages
            .FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.Slug == slug);

        if (page is null)
            return null;

        // Apply updates
        if (request.Title is not null)
        {
            page.Title = request.Title;
            page.Slug = GenerateSlug(request.Title);

            // Check slug uniqueness (excluding current page)
            var slugExists = await _dbContext.WikiPages
                .AnyAsync(w => w.ProjectId == project.Id && w.Slug == page.Slug && w.Id != page.Id);
            if (slugExists)
                throw new InvalidOperationException($"동일한 슬러그 '{page.Slug}'의 위키 페이지가 이미 존재합니다.");
        }

        if (request.ContentHtml is not null)
            page.ContentHtml = request.ContentHtml;

        if (request.ParentPageId.HasValue)
        {
            if (request.ParentPageId.Value == 0)
            {
                page.ParentPageId = null;
            }
            else
            {
                var parentExists = await _dbContext.WikiPages
                    .AnyAsync(w => w.Id == request.ParentPageId.Value && w.ProjectId == project.Id);
                if (!parentExists)
                    throw new KeyNotFoundException("상위 위키 페이지를 찾을 수 없습니다.");
                page.ParentPageId = request.ParentPageId.Value;
            }
        }

        // Increment version
        page.Version++;

        // Create version snapshot
        var versionSnapshot = new WikiPageVersion
        {
            WikiPageId = page.Id,
            Version = page.Version,
            Title = page.Title,
            ContentHtml = page.ContentHtml,
            EditedByUserId = userId,
            Comments = request.Comments
        };

        _dbContext.WikiPageVersions.Add(versionSnapshot);
        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties
        var updated = await _dbContext.WikiPages
            .Include(w => w.Author)
            .Include(w => w.Children)
                .ThenInclude(c => c.Author)
            .FirstAsync(w => w.Id == page.Id);

        return MapToDetailDto(updated);
    }

    public async Task<bool> DeleteAsync(string projectIdentifier, string slug)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var page = await _dbContext.WikiPages
            .Include(w => w.Versions)
            .Include(w => w.Children)
            .FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.Slug == slug);

        if (page is null)
            return false;

        if (page.Children.Count > 0)
            throw new InvalidOperationException("하위 페이지가 있는 위키 페이지는 삭제할 수 없습니다.");

        // Remove version history first
        _dbContext.WikiPageVersions.RemoveRange(page.Versions);
        _dbContext.WikiPages.Remove(page);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<WikiPageVersionDto>> GetVersionsAsync(string projectIdentifier, string slug)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var page = await _dbContext.WikiPages
            .FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.Slug == slug)
            ?? throw new KeyNotFoundException("위키 페이지를 찾을 수 없습니다.");

        var versions = await _dbContext.WikiPageVersions
            .Include(v => v.EditedBy)
            .Where(v => v.WikiPageId == page.Id)
            .OrderByDescending(v => v.Version)
            .ToListAsync();

        return versions.Select(v => new WikiPageVersionDto
        {
            Version = v.Version,
            Title = v.Title,
            EditedByName = $"{v.EditedBy.FirstName} {v.EditedBy.LastName}".Trim(),
            Comments = v.Comments,
            CreatedAt = v.CreatedAt
        }).ToList();
    }

    public async Task<WikiPageVersionDto?> GetVersionAsync(string projectIdentifier, string slug, int version)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var page = await _dbContext.WikiPages
            .FirstOrDefaultAsync(w => w.ProjectId == project.Id && w.Slug == slug)
            ?? throw new KeyNotFoundException("위키 페이지를 찾을 수 없습니다.");

        var pageVersion = await _dbContext.WikiPageVersions
            .Include(v => v.EditedBy)
            .FirstOrDefaultAsync(v => v.WikiPageId == page.Id && v.Version == version);

        if (pageVersion is null)
            return null;

        return new WikiPageVersionDto
        {
            Version = pageVersion.Version,
            Title = pageVersion.Title,
            EditedByName = $"{pageVersion.EditedBy.FirstName} {pageVersion.EditedBy.LastName}".Trim(),
            Comments = pageVersion.Comments,
            CreatedAt = pageVersion.CreatedAt
        };
    }

    private static string GenerateSlug(string title)
    {
        // Lowercase, replace spaces with hyphens, keep Korean characters and alphanumeric
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"\s+", "-");
        // Allow Korean (Hangul), alphanumeric, and hyphens
        slug = Regex.Replace(slug, @"[^\w\uAC00-\uD7A3\u3131-\u3163\u1100-\u11FF-]", "");
        slug = Regex.Replace(slug, @"-{2,}", "-");
        slug = slug.Trim('-');
        return slug;
    }

    private static WikiPageDto MapToDto(WikiPage page)
    {
        return new WikiPageDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            ParentPageId = page.ParentPageId,
            AuthorName = $"{page.Author.FirstName} {page.Author.LastName}".Trim(),
            Version = page.Version,
            UpdatedAt = page.UpdatedAt
        };
    }

    private static WikiPageDetailDto MapToDetailDto(WikiPage page)
    {
        return new WikiPageDetailDto
        {
            Id = page.Id,
            Title = page.Title,
            Slug = page.Slug,
            ParentPageId = page.ParentPageId,
            ContentHtml = page.ContentHtml,
            AuthorName = $"{page.Author.FirstName} {page.Author.LastName}".Trim(),
            Version = page.Version,
            UpdatedAt = page.UpdatedAt,
            Children = page.Children.Select(MapToDto).ToList()
        };
    }
}
