using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Notifications.Dtos;
using Nexmine.Application.Features.Notifications.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly NexmineDbContext _dbContext;

    public NotificationService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<NotificationListDto> GetNotificationsAsync(int userId, int page = 1, int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var unreadCount = await _dbContext.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(n => n.Actor)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                LinkUrl = n.LinkUrl,
                IsRead = n.IsRead,
                ActorName = n.Actor != null
                    ? (n.Actor.FirstName + " " + n.Actor.LastName).Trim()
                    : null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return new NotificationListDto
        {
            Items = items,
            UnreadCount = unreadCount
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _dbContext.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(int userId, int notificationId)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification is null)
            throw new KeyNotFoundException("알림을 찾을 수 없습니다.");

        notification.IsRead = true;
        await _dbContext.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task CreateNotificationAsync(int userId, string type, string title, string? message, string? linkUrl, int? actorId)
    {
        // Do not notify the actor themselves
        if (actorId.HasValue && actorId.Value == userId)
            return;

        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            LinkUrl = linkUrl,
            IsRead = false,
            ActorId = actorId
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();
    }
}
