namespace Nexmine.Application.Features.Forums.Dtos;

public class ForumDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<ForumTopicDto> Topics { get; set; } = [];
}
