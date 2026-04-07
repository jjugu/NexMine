namespace Nexmine.Application.Features.Issues.Dtos;

public class JournalDetailDto
{
    public string PropertyName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}
