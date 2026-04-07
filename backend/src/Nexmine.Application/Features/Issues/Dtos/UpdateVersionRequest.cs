using Nexmine.Domain.Enums;

namespace Nexmine.Application.Features.Issues.Dtos;

public class UpdateVersionRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public VersionStatus? Status { get; set; }
    public DateOnly? DueDate { get; set; }
}
