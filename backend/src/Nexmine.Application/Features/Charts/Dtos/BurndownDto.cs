namespace Nexmine.Application.Features.Charts.Dtos;

public class BurndownDto
{
    public List<string> Dates { get; set; } = [];
    public List<int> Remaining { get; set; } = [];
    public List<int> Ideal { get; set; } = [];
}
