namespace Nexmine.Domain.Entities;

public class ForumReply : BaseEntity
{
    public int TopicId { get; set; }
    public int AuthorId { get; set; }
    public string Content { get; set; } = "";

    public ForumTopic Topic { get; set; } = null!;
    public User Author { get; set; } = null!;
}
