namespace Nexmine.Application.Features.SavedQueries.Dtos;

public class UpdateSavedQueryRequest
{
    public string? Name { get; set; }
    public Dictionary<string, string>? Filters { get; set; }
    public bool? IsPublic { get; set; }
    public int? Position { get; set; }
}
