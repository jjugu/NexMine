namespace Nexmine.Application.Features.Notifications.Dtos;

public class NotificationListDto
{
    public List<NotificationDto> Items { get; set; } = [];
    public int UnreadCount { get; set; }
}
