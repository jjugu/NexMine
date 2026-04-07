namespace Nexmine.Application.Features.Admin.Dtos;

public class CreatePriorityRequest
{
    public string Name { get; set; } = string.Empty;
    public bool? IsDefault { get; set; }
    public int? Position { get; set; }
}
