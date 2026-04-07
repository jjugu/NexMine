namespace Nexmine.Application.Features.Documents.Dtos;

public class CreateDocumentRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CategoryName { get; set; }
}
