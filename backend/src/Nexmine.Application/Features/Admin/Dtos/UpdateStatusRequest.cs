namespace Nexmine.Application.Features.Admin.Dtos;

public class UpdateStatusRequest
{
    public string? Name { get; set; }
    public bool? IsClosed { get; set; }
    public int? Position { get; set; }
}
