namespace Nexmine.Application.Features.UserPreferences.Dtos;

public class UserPreferenceDto
{
    public string Language { get; set; } = "ko";
    public string Timezone { get; set; } = "Asia/Seoul";
    public int PageSize { get; set; } = 25;
    public string Theme { get; set; } = "system";
    public bool EmailNotifications { get; set; } = true;
}
