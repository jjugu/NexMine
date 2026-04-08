using Nexmine.Application.Features.Notifications.Dtos;

namespace Nexmine.Application.Features.Notifications.Interfaces;

public interface INotificationService
{
    Task<NotificationListDto> GetNotificationsAsync(int userId, int page = 1, int pageSize = 20);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int userId, int notificationId);
    Task MarkAllAsReadAsync(int userId);
    Task CreateNotificationAsync(int userId, string type, string title, string? message, string? linkUrl, int? actorId);
}
