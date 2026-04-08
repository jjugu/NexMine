namespace Nexmine.Application.Features.Forums.Dtos;

public class ForumTopicDto
{
    public int Id { get; set; }
    public int ForumId { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Content { get; set; } = "";
    public bool IsSticky { get; set; }
    public bool IsLocked { get; set; }
    public int RepliesCount { get; set; }
    public DateTime? LastReplyAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
