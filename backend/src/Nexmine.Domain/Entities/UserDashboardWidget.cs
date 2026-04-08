namespace Nexmine.Domain.Entities;

public class UserDashboardWidget : BaseEntity
{
    public int UserId { get; set; }
    public string WidgetType { get; set; } = "";
    public int Position { get; set; }
    public int Column { get; set; }
    public string? SettingsJson { get; set; }

    public User User { get; set; } = null!;
}
