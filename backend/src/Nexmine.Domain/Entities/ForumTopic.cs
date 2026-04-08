namespace Nexmine.Domain.Entities;

public class ForumTopic : BaseEntity
{
    public int ForumId { get; set; }
    public int AuthorId { get; set; }
    public string Subject { get; set; } = "";
    public string Content { get; set; } = "";
    public bool IsSticky { get; set; }
    public bool IsLocked { get; set; }
    public int RepliesCount { get; set; }
    public DateTime? LastReplyAt { get; set; }

    public Forum Forum { get; set; } = null!;
    public User Author { get; set; } = null!;
    public ICollection<ForumReply> Replies { get; set; } = new List<ForumReply>();
}
