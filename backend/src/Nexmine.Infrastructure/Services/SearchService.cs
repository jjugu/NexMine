using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Search.Dtos;
using Nexmine.Application.Features.Search.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public partial class SearchService : ISearchService
{
    private readonly NexmineDbContext _dbContext;

    public SearchService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<SearchResultItemDto>> SearchAsync(
        string query, string scope, int userId, int page, int pageSize)
    {
        var accessibleProjectIds = await GetAccessibleProjectIdsAsync(userId);

        var results = new List<SearchResultItemDto>();

        if (scope is "all" or "issues")
        {
            var issueResults = await SearchIssuesAsync(query, accessibleProjectIds);
            results.AddRange(issueResults);
        }

        if (scope is "all" or "wiki")
        {
            var wikiResults = await SearchWikiAsync(query, accessibleProjectIds);
            results.AddRange(wikiResults);
        }

        var ordered = results
            .OrderByDescending(r => r.UpdatedAt)
            .ToList();

        var totalCount = ordered.Count;
        var paged = ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResult<SearchResultItemDto>
        {
            Items = paged,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private async Task<List<int>> GetAccessibleProjectIdsAsync(int userId)
    {
        var memberProjectIds = await _dbContext.ProjectMemberships
            .Where(m => m.UserId == userId)
            .Select(m => m.ProjectId)
            .ToListAsync();

        var publicProjectIds = await _dbContext.Projects
            .Where(p => p.IsPublic && !p.IsArchived)
            .Select(p => p.Id)
            .ToListAsync();

        return memberProjectIds.Union(publicProjectIds).ToList();
    }

    private async Task<List<SearchResultItemDto>> SearchIssuesAsync(
        string query, List<int> accessibleProjectIds)
    {
        var lowerQuery = query.ToLower();

        return await _dbContext.Issues
            .Include(i => i.Project)
            .Where(i => accessibleProjectIds.Contains(i.ProjectId))
            .Where(i =>
                i.Subject.ToLower().Contains(lowerQuery) ||
                (i.Description != null && i.Description.ToLower().Contains(lowerQuery)))
            .Select(i => new SearchResultItemDto
            {
                Type = "issue",
                Id = i.Id,
                Title = "#" + i.Id + " " + i.Subject,
                ProjectIdentifier = i.Project.Identifier,
                ProjectName = i.Project.Name,
                Snippet = i.Description != null
                    ? i.Description.Substring(0, Math.Min(i.Description.Length, 100))
                    : null,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();
    }

    private async Task<List<SearchResultItemDto>> SearchWikiAsync(
        string query, List<int> accessibleProjectIds)
    {
        var lowerQuery = query.ToLower();

        var wikiPages = await _dbContext.WikiPages
            .Include(w => w.Project)
            .Where(w => accessibleProjectIds.Contains(w.ProjectId))
            .Where(w =>
                w.Title.ToLower().Contains(lowerQuery) ||
                (w.ContentHtml != null && w.ContentHtml.ToLower().Contains(lowerQuery)))
            .Select(w => new
            {
                w.Id,
                w.Title,
                w.ContentHtml,
                w.Project.Identifier,
                ProjectName = w.Project.Name,
                w.UpdatedAt
            })
            .ToListAsync();

        return wikiPages.Select(w => new SearchResultItemDto
        {
            Type = "wiki",
            Id = w.Id,
            Title = w.Title,
            ProjectIdentifier = w.Identifier,
            ProjectName = w.ProjectName,
            Snippet = ExtractSnippet(w.ContentHtml, query),
            UpdatedAt = w.UpdatedAt
        }).ToList();
    }

    private static string? ExtractSnippet(string? html, string query)
    {
        if (string.IsNullOrEmpty(html)) return null;

        var text = StripHtmlTags(html);
        var idx = text.IndexOf(query, StringComparison.OrdinalIgnoreCase);

        if (idx < 0)
        {
            return text.Length > 100 ? text[..100] + "..." : text;
        }

        var start = Math.Max(0, idx - 50);
        var length = Math.Min(100, text.Length - start);
        var snippet = text.Substring(start, length);

        if (start > 0) snippet = "..." + snippet;
        if (start + length < text.Length) snippet += "...";

        return snippet;
    }

    private static string StripHtmlTags(string html)
    {
        return HtmlTagRegex().Replace(html, string.Empty);
    }

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex HtmlTagRegex();
}
