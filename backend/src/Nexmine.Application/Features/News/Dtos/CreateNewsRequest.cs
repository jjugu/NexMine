namespace Nexmine.Application.Features.News.Dtos;

public class CreateNewsRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Description { get; set; }
}
