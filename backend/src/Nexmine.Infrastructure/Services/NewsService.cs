using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.News.Dtos;
using Nexmine.Application.Features.News.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class NewsService : INewsService
{
    private readonly NexmineDbContext _dbContext;

    public NewsService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<NewsDto>> ListAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var newsList = await _dbContext.News
            .Include(n => n.Author)
            .Include(n => n.Project)
            .Where(n => n.ProjectId == project.Id)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return newsList.Select(MapToDto).ToList();
    }

    public async Task<NewsDto?> GetByIdAsync(int id)
    {
        var news = await _dbContext.News
            .Include(n => n.Author)
            .Include(n => n.Project)
            .FirstOrDefaultAsync(n => n.Id == id);

        return news is null ? null : MapToDto(news);
    }

    public async Task<NewsDto> CreateAsync(string projectIdentifier, CreateNewsRequest request, int userId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var news = new News
        {
            ProjectId = project.Id,
            AuthorId = userId,
            Title = request.Title,
            Summary = request.Summary,
            Description = request.Description
        };

        _dbContext.News.Add(news);
        await _dbContext.SaveChangesAsync();

        var created = await _dbContext.News
            .Include(n => n.Author)
            .Include(n => n.Project)
            .FirstAsync(n => n.Id == news.Id);

        return MapToDto(created);
    }

    public async Task<NewsDto?> UpdateAsync(int id, UpdateNewsRequest request)
    {
        var news = await _dbContext.News
            .FirstOrDefaultAsync(n => n.Id == id);

        if (news is null)
            return null;

        if (request.Title is not null)
            news.Title = request.Title;

        if (request.Summary is not null)
            news.Summary = request.Summary;

        if (request.Description is not null)
            news.Description = request.Description;

        await _dbContext.SaveChangesAsync();

        var updated = await _dbContext.News
            .Include(n => n.Author)
            .Include(n => n.Project)
            .FirstAsync(n => n.Id == news.Id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var news = await _dbContext.News.FindAsync(id);
        if (news is null)
            return false;

        _dbContext.News.Remove(news);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static NewsDto MapToDto(News news)
    {
        return new NewsDto
        {
            Id = news.Id,
            ProjectId = news.ProjectId,
            ProjectName = news.Project.Name,
            AuthorId = news.AuthorId,
            AuthorName = $"{news.Author.FirstName} {news.Author.LastName}".Trim(),
            Title = news.Title,
            Summary = news.Summary,
            Description = news.Description,
            CreatedAt = news.CreatedAt,
            UpdatedAt = news.UpdatedAt
        };
    }
}
