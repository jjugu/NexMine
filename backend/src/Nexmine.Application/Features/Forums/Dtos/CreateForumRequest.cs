namespace Nexmine.Application.Features.Forums.Dtos;

public class CreateForumRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Position { get; set; }
}
