namespace Nexmine.Application.Features.Admin.Dtos;

public class UpdatePriorityRequest
{
    public string? Name { get; set; }
    public bool? IsDefault { get; set; }
    public int? Position { get; set; }
}
