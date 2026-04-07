namespace Nexmine.Domain.Entities;

public class CustomFieldProject
{
    public int CustomFieldId { get; set; }
    public int ProjectId { get; set; }

    public CustomField CustomField { get; set; } = null!;
    public Project Project { get; set; } = null!;
}
