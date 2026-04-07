using Nexmine.Domain.Enums;

namespace Nexmine.Domain.Entities;

public class CustomField : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public CustomFieldFormat FieldFormat { get; set; }
    public string Customizable { get; set; } = "issue";
    public bool IsRequired { get; set; }
    public bool IsForAll { get; set; }
    public bool IsFilter { get; set; }
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? Regexp { get; set; }
    public string? PossibleValuesJson { get; set; }
    public string? DefaultValue { get; set; }
    public int Position { get; set; }
    public string? Description { get; set; }

    public ICollection<CustomValue> CustomValues { get; set; } = new List<CustomValue>();
    public ICollection<CustomFieldProject> Projects { get; set; } = new List<CustomFieldProject>();
    public ICollection<CustomFieldTracker> Trackers { get; set; } = new List<CustomFieldTracker>();
}
