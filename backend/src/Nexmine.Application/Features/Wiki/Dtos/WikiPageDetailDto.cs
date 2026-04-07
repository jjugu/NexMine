namespace Nexmine.Application.Features.Wiki.Dtos;

public class WikiPageDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int? ParentPageId { get; set; }
    public string? ContentHtml { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<WikiPageDto> Children { get; set; } = [];
}
