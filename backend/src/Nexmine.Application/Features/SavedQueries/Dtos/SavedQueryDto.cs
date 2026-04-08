namespace Nexmine.Application.Features.SavedQueries.Dtos;

public class SavedQueryDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, string> Filters { get; set; } = new();
    public bool IsPublic { get; set; }
    public int Position { get; set; }
}
