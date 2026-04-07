namespace Nexmine.Application.Features.Issues.Dtos;

public class IssueCategoryDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
}
