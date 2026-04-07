namespace Nexmine.Application.Features.Documents.Dtos;

public class DocumentDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CategoryName { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DocumentAttachmentDto> Attachments { get; set; } = [];
}

public class DocumentAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; }
}
