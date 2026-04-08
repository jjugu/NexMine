namespace Nexmine.Domain.Entities;

public class Watcher
{
    public string WatchableType { get; set; } = string.Empty;
    public int WatchableId { get; set; }
    public int UserId { get; set; }

    public User User { get; set; } = null!;
}
