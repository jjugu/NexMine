namespace Nexmine.Application.Features.Forums.Dtos;

public class ForumDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Position { get; set; }
    public int TopicsCount { get; set; }
}
