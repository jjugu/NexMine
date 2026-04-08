namespace Nexmine.Application.Features.Forums.Dtos;

public class UpdateTopicRequest
{
    public string? Subject { get; set; }
    public string? Content { get; set; }
    public bool? IsSticky { get; set; }
    public bool? IsLocked { get; set; }
}
