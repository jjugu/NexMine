namespace Nexmine.Domain.Entities;

public class UserPreference : BaseEntity
{
    public int UserId { get; set; }
    public string Language { get; set; } = "ko";
    public string Timezone { get; set; } = "Asia/Seoul";
    public int PageSize { get; set; } = 25;
    public string Theme { get; set; } = "system";
    public bool EmailNotifications { get; set; } = true;

    public User User { get; set; } = null!;
}
