namespace Nexmine.Application.Features.Wiki.Dtos;

public class UpdateWikiPageRequest
{
    public string? Title { get; set; }
    public string? ContentHtml { get; set; }
    public int? ParentPageId { get; set; }
    public string? Comments { get; set; }
}
