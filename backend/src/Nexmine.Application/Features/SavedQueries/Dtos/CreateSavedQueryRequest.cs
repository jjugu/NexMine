namespace Nexmine.Application.Features.SavedQueries.Dtos;

public class CreateSavedQueryRequest
{
    public int? ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, string> Filters { get; set; } = new();
    public bool IsPublic { get; set; }
}
