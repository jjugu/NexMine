using Nexmine.Application.Features.Forums.Dtos;

namespace Nexmine.Application.Features.Forums.Interfaces;

public interface IForumService
{
    Task<List<ForumDto>> ListForumsAsync(string projectIdentifier);
    Task<ForumDto> CreateForumAsync(string projectIdentifier, CreateForumRequest request);
    Task<ForumDto?> UpdateForumAsync(int forumId, CreateForumRequest request);
    Task<bool> DeleteForumAsync(int forumId);

    Task<List<ForumTopicDto>> ListTopicsAsync(int forumId);
    Task<ForumTopicDetailDto?> GetTopicAsync(int topicId);
    Task<ForumTopicDetailDto> CreateTopicAsync(int forumId, CreateTopicRequest request, int userId);
    Task<ForumTopicDetailDto?> UpdateTopicAsync(int topicId, UpdateTopicRequest request);
    Task<bool> DeleteTopicAsync(int topicId);

    Task<ForumReplyDto> CreateReplyAsync(int topicId, CreateReplyRequest request, int userId);
    Task<bool> DeleteReplyAsync(int replyId);
}
