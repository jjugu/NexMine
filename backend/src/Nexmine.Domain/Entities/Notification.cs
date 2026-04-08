namespace Nexmine.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Message { get; set; }
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public int? ActorId { get; set; }

    public User User { get; set; } = null!;
    public User? Actor { get; set; }
}
