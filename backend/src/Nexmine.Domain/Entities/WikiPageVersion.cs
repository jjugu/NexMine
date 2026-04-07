namespace Nexmine.Domain.Entities;

public class WikiPageVersion : BaseEntity
{
    public int WikiPageId { get; set; }
    public int Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    public int EditedByUserId { get; set; }
    public string? Comments { get; set; }

    public WikiPage WikiPage { get; set; } = null!;
    public User EditedBy { get; set; } = null!;
}
