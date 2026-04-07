namespace Nexmine.Application.Features.Admin.Dtos;

public class CreateStatusRequest
{
    public string Name { get; set; } = string.Empty;
    public bool? IsClosed { get; set; }
    public int? Position { get; set; }
}
