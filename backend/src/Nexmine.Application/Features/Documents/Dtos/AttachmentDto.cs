namespace Nexmine.Application.Features.Documents.Dtos;

public class AttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string AttachableType { get; set; } = string.Empty;
    public int AttachableId { get; set; }
    public string? Description { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
