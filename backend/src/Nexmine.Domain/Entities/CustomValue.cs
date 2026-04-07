namespace Nexmine.Domain.Entities;

public class CustomValue : BaseEntity
{
    public int CustomFieldId { get; set; }
    public string CustomizableType { get; set; } = string.Empty;
    public int CustomizableId { get; set; }
    public string? Value { get; set; }

    public CustomField CustomField { get; set; } = null!;
}
