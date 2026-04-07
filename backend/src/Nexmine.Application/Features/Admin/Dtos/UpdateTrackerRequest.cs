namespace Nexmine.Application.Features.Admin.Dtos;

public class UpdateTrackerRequest
{
    public string? Name { get; set; }
    public int? Position { get; set; }
    public bool? IsDefault { get; set; }
}
