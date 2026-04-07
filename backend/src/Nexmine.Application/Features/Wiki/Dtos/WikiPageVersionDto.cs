namespace Nexmine.Application.Features.Wiki.Dtos;

public class WikiPageVersionDto
{
    public int Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public string EditedByName { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; }
}
