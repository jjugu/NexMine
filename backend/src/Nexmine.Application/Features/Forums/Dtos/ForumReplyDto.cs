namespace Nexmine.Application.Features.Forums.Dtos;

public class ForumReplyDto
{
    public int Id { get; set; }
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
