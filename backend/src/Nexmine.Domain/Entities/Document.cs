namespace Nexmine.Domain.Entities;

public class Document : BaseEntity
{
    public int ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CategoryName { get; set; }
    public int AuthorId { get; set; }

    public Project Project { get; set; } = null!;
    public User Author { get; set; } = null!;
}
