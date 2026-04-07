namespace Nexmine.Application.Features.Search.Dtos;

public class SearchResultItemDto
{
    public string Type { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ProjectIdentifier { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string? Snippet { get; set; }
    public DateTime UpdatedAt { get; set; }
}
