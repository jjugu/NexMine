namespace Nexmine.Application.Features.Activities.Dtos;

public class ActivityFilterParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? Type { get; set; }
    public int? UserId { get; set; }
}
