namespace Nexmine.Application.Features.Documents.Dtos;

public class AttachmentUploadResult
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
}
