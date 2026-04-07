namespace Nexmine.Application.Features.CustomFields.Dtos;

public class SetCustomValuesRequest
{
    public List<CustomValueItem> Values { get; set; } = [];
}

public class CustomValueItem
{
    public int CustomFieldId { get; set; }
    public string? Value { get; set; }
}
