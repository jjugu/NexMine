using Nexmine.Application.Features.CustomFields.Dtos;

namespace Nexmine.Application.Features.CustomFields.Interfaces;

public interface ICustomFieldService
{
    Task<List<CustomFieldDto>> ListAsync(string? customizable = null);
    Task<CustomFieldDto?> GetByIdAsync(int id);
    Task<CustomFieldDto> CreateAsync(CreateCustomFieldRequest request);
    Task<CustomFieldDto?> UpdateAsync(int id, UpdateCustomFieldRequest request);
    Task<bool> DeleteAsync(int id);
    Task<List<CustomFieldDto>> GetForProjectAsync(string projectIdentifier, string customizable = "issue");
    Task<List<CustomValueDto>> GetValuesAsync(string customizableType, int customizableId);
    Task SetValuesAsync(string customizableType, int customizableId, List<CustomValueItem> values);
}
