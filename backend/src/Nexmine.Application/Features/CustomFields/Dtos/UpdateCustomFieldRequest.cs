using Nexmine.Domain.Enums;

namespace Nexmine.Application.Features.CustomFields.Dtos;

public class UpdateCustomFieldRequest
{
    public string? Name { get; set; }
    public CustomFieldFormat? FieldFormat { get; set; }
    public bool? IsRequired { get; set; }
    public bool? IsForAll { get; set; }
    public bool? IsFilter { get; set; }
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Regexp { get; set; }
    public string[]? PossibleValues { get; set; }
    public string? DefaultValue { get; set; }
    public int? Position { get; set; }
    public string? Description { get; set; }
    public int[]? ProjectIds { get; set; }
    public int[]? TrackerIds { get; set; }
}
