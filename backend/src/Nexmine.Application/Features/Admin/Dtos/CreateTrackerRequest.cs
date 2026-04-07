namespace Nexmine.Application.Features.Admin.Dtos;

public class CreateTrackerRequest
{
    public string Name { get; set; } = string.Empty;
    public int? Position { get; set; }
    public bool? IsDefault { get; set; }
}
