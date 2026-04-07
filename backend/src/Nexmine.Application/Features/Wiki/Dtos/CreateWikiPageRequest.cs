namespace Nexmine.Application.Features.Wiki.Dtos;

public class CreateWikiPageRequest
{
    public string Title { get; set; } = string.Empty;
    public string? ContentHtml { get; set; }
    public int? ParentPageId { get; set; }
}
