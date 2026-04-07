using Nexmine.Domain.Enums;

namespace Nexmine.Application.Features.Issues.Dtos;

public class CreateVersionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Open;
    public DateOnly? DueDate { get; set; }
}
