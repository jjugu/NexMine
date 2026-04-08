using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Forums.Dtos;
using Nexmine.Application.Features.Forums.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ForumService : IForumService
{
    private readonly NexmineDbContext _dbContext;

    public ForumService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ForumDto>> ListForumsAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        return await _dbContext.Forums
            .Where(f => f.ProjectId == project.Id)
            .OrderBy(f => f.Position)
            .Select(f => new ForumDto
            {
                Id = f.Id,
                ProjectId = f.ProjectId,
                Name = f.Name,
                Description = f.Description,
                Position = f.Position,
                TopicsCount = f.Topics.Count
            })
            .ToListAsync();
    }

    public async Task<ForumDto> CreateForumAsync(string projectIdentifier, CreateForumRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var forum = new Forum
        {
            ProjectId = project.Id,
            Name = request.Name,
            Description = request.Description,
            Position = request.Position
        };

        _dbContext.Forums.Add(forum);
        await _dbContext.SaveChangesAsync();

        return new ForumDto
        {
            Id = forum.Id,
            ProjectId = forum.ProjectId,
            Name = forum.Name,
            Description = forum.Description,
            Position = forum.Position,
            TopicsCount = 0
        };
    }

    public async Task<ForumDto?> UpdateForumAsync(int forumId, CreateForumRequest request)
    {
        var forum = await _dbContext.Forums
            .Include(f => f.Topics)
            .FirstOrDefaultAsync(f => f.Id == forumId);

        if (forum is null)
            return null;

        forum.Name = request.Name;
        forum.Description = request.Description;
        forum.Position = request.Position;

        await _dbContext.SaveChangesAsync();

        return new ForumDto
        {
            Id = forum.Id,
            ProjectId = forum.ProjectId,
            Name = forum.Name,
            Description = forum.Description,
            Position = forum.Position,
            TopicsCount = forum.Topics.Count
        };
    }

    public async Task<bool> DeleteForumAsync(int forumId)
    {
        var forum = await _dbContext.Forums.FindAsync(forumId);
        if (forum is null)
            return false;

        _dbContext.Forums.Remove(forum);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<ForumTopicDto>> ListTopicsAsync(int forumId)
    {
        var topics = await _dbContext.ForumTopics
            .Where(t => t.ForumId == forumId)
            .Include(t => t.Author)
            .OrderByDescending(t => t.IsSticky)
            .ThenByDescending(t => t.LastReplyAt ?? t.CreatedAt)
            .ToListAsync();

        return topics.Select(t => new ForumTopicDto
        {
            Id = t.Id,
            ForumId = t.ForumId,
            AuthorId = t.AuthorId,
            AuthorName = FormatUserName(t.Author),
            Subject = t.Subject,
            Content = t.Content,
            IsSticky = t.IsSticky,
            IsLocked = t.IsLocked,
            RepliesCount = t.RepliesCount,
            LastReplyAt = t.LastReplyAt,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<ForumTopicDetailDto?> GetTopicAsync(int topicId)
    {
        var topic = await _dbContext.ForumTopics
            .Include(t => t.Author)
            .Include(t => t.Replies)
                .ThenInclude(r => r.Author)
            .FirstOrDefaultAsync(t => t.Id == topicId);

        if (topic is null)
            return null;

        return MapToTopicDetailDto(topic);
    }

    public async Task<ForumTopicDetailDto> CreateTopicAsync(int forumId, CreateTopicRequest request, int userId)
    {
        var forum = await _dbContext.Forums.FindAsync(forumId)
            ?? throw new KeyNotFoundException("포럼을 찾을 수 없습니다.");

        var topic = new ForumTopic
        {
            ForumId = forumId,
            AuthorId = userId,
            Subject = request.Subject,
            Content = request.Content
        };

        _dbContext.ForumTopics.Add(topic);
        await _dbContext.SaveChangesAsync();

        // Reload with Author
        await _dbContext.Entry(topic).Reference(t => t.Author).LoadAsync();

        return MapToTopicDetailDto(topic);
    }

    public async Task<ForumTopicDetailDto?> UpdateTopicAsync(int topicId, UpdateTopicRequest request)
    {
        var topic = await _dbContext.ForumTopics
            .Include(t => t.Author)
            .Include(t => t.Replies)
                .ThenInclude(r => r.Author)
            .FirstOrDefaultAsync(t => t.Id == topicId);

        if (topic is null)
            return null;

        if (request.Subject is not null)
            topic.Subject = request.Subject;

        if (request.Content is not null)
            topic.Content = request.Content;

        if (request.IsSticky.HasValue)
            topic.IsSticky = request.IsSticky.Value;

        if (request.IsLocked.HasValue)
            topic.IsLocked = request.IsLocked.Value;

        await _dbContext.SaveChangesAsync();

        return MapToTopicDetailDto(topic);
    }

    public async Task<bool> DeleteTopicAsync(int topicId)
    {
        var topic = await _dbContext.ForumTopics.FindAsync(topicId);
        if (topic is null)
            return false;

        _dbContext.ForumTopics.Remove(topic);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<ForumReplyDto> CreateReplyAsync(int topicId, CreateReplyRequest request, int userId)
    {
        var topic = await _dbContext.ForumTopics.FindAsync(topicId)
            ?? throw new KeyNotFoundException("주제를 찾을 수 없습니다.");

        if (topic.IsLocked)
            throw new InvalidOperationException("잠긴 주제에는 답글을 작성할 수 없습니다.");

        var reply = new ForumReply
        {
            TopicId = topicId,
            AuthorId = userId,
            Content = request.Content
        };

        topic.RepliesCount++;
        topic.LastReplyAt = DateTime.UtcNow;

        _dbContext.ForumReplies.Add(reply);
        await _dbContext.SaveChangesAsync();

        // Reload Author
        await _dbContext.Entry(reply).Reference(r => r.Author).LoadAsync();

        return new ForumReplyDto
        {
            Id = reply.Id,
            AuthorId = reply.AuthorId,
            AuthorName = FormatUserName(reply.Author),
            Content = reply.Content,
            CreatedAt = reply.CreatedAt
        };
    }

    public async Task<bool> DeleteReplyAsync(int replyId)
    {
        var reply = await _dbContext.ForumReplies
            .Include(r => r.Topic)
            .FirstOrDefaultAsync(r => r.Id == replyId);

        if (reply is null)
            return false;

        reply.Topic.RepliesCount = Math.Max(0, reply.Topic.RepliesCount - 1);

        _dbContext.ForumReplies.Remove(reply);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static ForumTopicDetailDto MapToTopicDetailDto(ForumTopic topic)
    {
        return new ForumTopicDetailDto
        {
            Id = topic.Id,
            ForumId = topic.ForumId,
            AuthorId = topic.AuthorId,
            AuthorName = FormatUserName(topic.Author),
            Subject = topic.Subject,
            Content = topic.Content,
            IsSticky = topic.IsSticky,
            IsLocked = topic.IsLocked,
            RepliesCount = topic.RepliesCount,
            CreatedAt = topic.CreatedAt,
            Replies = topic.Replies
                .OrderBy(r => r.CreatedAt)
                .Select(r => new ForumReplyDto
                {
                    Id = r.Id,
                    AuthorId = r.AuthorId,
                    AuthorName = FormatUserName(r.Author),
                    Content = r.Content,
                    CreatedAt = r.CreatedAt
                })
                .ToList()
        };
    }

    private static string FormatUserName(User user)
    {
        var name = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrEmpty(name) ? user.Username : name;
    }
}
