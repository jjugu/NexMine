using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Nexmine.Api.Hubs;

[Authorize]
public class NexmineHub : Hub
{
    /// <summary>
    /// Join a project group to receive project-level notifications.
    /// </summary>
    public async Task JoinProject(string projectIdentifier)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project:{projectIdentifier}");
    }

    /// <summary>
    /// Leave a project group.
    /// </summary>
    public async Task LeaveProject(string projectIdentifier)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project:{projectIdentifier}");
    }

    /// <summary>
    /// Join an issue detail page group for concurrent editing detection.
    /// </summary>
    public async Task JoinIssue(int issueId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        await Groups.AddToGroupAsync(Context.ConnectionId, $"issue:{issueId}");

        await Clients.OthersInGroup($"issue:{issueId}").SendAsync("UserJoinedIssue", new
        {
            issueId,
            userId,
            userName,
            connectionId = Context.ConnectionId
        });
    }

    /// <summary>
    /// Leave an issue detail page group.
    /// </summary>
    public async Task LeaveIssue(int issueId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"issue:{issueId}");

        await Clients.OthersInGroup($"issue:{issueId}").SendAsync("UserLeftIssue", new
        {
            issueId,
            userId,
            userName,
            connectionId = Context.ConnectionId
        });
    }

    /// <summary>
    /// Notify others that the current user started editing an issue.
    /// </summary>
    public async Task StartEditingIssue(int issueId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        await Clients.OthersInGroup($"issue:{issueId}").SendAsync("UserStartedEditing", new
        {
            issueId,
            userId,
            userName
        });
    }

    /// <summary>
    /// Notify others that the current user stopped editing an issue.
    /// </summary>
    public async Task StopEditingIssue(int issueId)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userName = Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        await Clients.OthersInGroup($"issue:{issueId}").SendAsync("UserStoppedEditing", new
        {
            issueId,
            userId,
            userName
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Groups automatically removes the connection on disconnect.
        await base.OnDisconnectedAsync(exception);
    }
}
