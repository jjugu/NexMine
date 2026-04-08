using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Notifications.Dtos;
using Nexmine.Application.Features.Notifications.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("/api/my/notifications")]
    [ProducesResponseType(typeof(NotificationListDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotificationsAsync([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.GetUserId();
        var result = await _notificationService.GetNotificationsAsync(userId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("/api/my/notifications/unread-count")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCountAsync()
    {
        var userId = User.GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPut("/api/my/notifications/{id:int}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsReadAsync(int id)
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAsReadAsync(userId, id);
        return Ok();
    }

    [HttpPut("/api/my/notifications/read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsReadAsync()
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }
}
