namespace Nexmine.Domain.Entities;

public class WikiPage : BaseEntity
{
    public int ProjectId { get; set; }
    public int? ParentPageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    public int AuthorId { get; set; }
    public int Version { get; set; } = 1;

    public Project Project { get; set; } = null!;
    public User Author { get; set; } = null!;
    public WikiPage? ParentPage { get; set; }
    public List<WikiPage> Children { get; set; } = [];
    public List<WikiPageVersion> Versions { get; set; } = [];
}
