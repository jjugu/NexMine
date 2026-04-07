namespace Nexmine.Domain.Entities;

public class CustomFieldTracker
{
    public int CustomFieldId { get; set; }
    public int TrackerId { get; set; }

    public CustomField CustomField { get; set; } = null!;
    public Tracker Tracker { get; set; } = null!;
}
