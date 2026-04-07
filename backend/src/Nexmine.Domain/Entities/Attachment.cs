namespace Nexmine.Domain.Entities;

public class Attachment : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string StoredPath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string AttachableType { get; set; } = string.Empty;
    public int AttachableId { get; set; }
    public string? Description { get; set; }
    public int AuthorId { get; set; }

    public User Author { get; set; } = null!;
}
