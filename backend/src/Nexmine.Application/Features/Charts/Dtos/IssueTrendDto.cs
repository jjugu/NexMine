namespace Nexmine.Application.Features.Charts.Dtos;

public class IssueTrendDto
{
    public List<string> Dates { get; set; } = [];
    public List<int> Created { get; set; } = [];
    public List<int> Closed { get; set; } = [];
}
