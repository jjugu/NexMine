namespace Nexmine.Application.Features.UserPreferences.Dtos;

public class UpdateUserPreferenceRequest
{
    public string? Language { get; set; }
    public string? Timezone { get; set; }
    public int? PageSize { get; set; }
    public string? Theme { get; set; }
    public bool? EmailNotifications { get; set; }
}
