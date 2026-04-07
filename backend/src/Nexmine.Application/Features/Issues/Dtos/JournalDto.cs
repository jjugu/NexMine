namespace Nexmine.Application.Features.Issues.Dtos;

public class JournalDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<JournalDetailDto> Details { get; set; } = [];
}
