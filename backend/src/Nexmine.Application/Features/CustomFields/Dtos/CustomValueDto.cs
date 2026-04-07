namespace Nexmine.Application.Features.CustomFields.Dtos;

public class CustomValueDto
{
    public int CustomFieldId { get; set; }
    public string CustomFieldName { get; set; } = string.Empty;
    public string? Value { get; set; }
}
