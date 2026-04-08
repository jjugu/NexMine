using Microsoft.AspNetCore.SignalR;
using Nexmine.Api.Hubs;
using Nexmine.Application.Features.Realtime.Interfaces;

namespace Nexmine.Api.Services;

public class RealtimeNotificationService : IRealtimeNotificationService
{
    private readonly IHubContext<NexmineHub> _hubContext;

    public RealtimeNotificationService(IHubContext<NexmineHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyIssueCreatedAsync(string projectIdentifier, int issueId, string subject, string userName)
    {
        await _hubContext.Clients.Group($"project:{projectIdentifier}").SendAsync("IssueCreated", new
        {
            issueId,
            subject,
            userName,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyIssueUpdatedAsync(string projectIdentifier, int issueId, string subject, string userName)
    {
        await _hubContext.Clients.Group($"project:{projectIdentifier}").SendAsync("IssueUpdated", new
        {
            issueId,
            subject,
            userName,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyIssueCommentedAsync(string projectIdentifier, int issueId, string subject, string userName, string? notes)
    {
        await _hubContext.Clients.Group($"project:{projectIdentifier}").SendAsync("IssueCommented", new
        {
            issueId,
            subject,
            userName,
            notes,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyIssueChangedAsync(int issueId, string userName)
    {
        await _hubContext.Clients.Group($"issue:{issueId}").SendAsync("IssueChanged", new
        {
            issueId,
            userName,
            timestamp = DateTime.UtcNow
        });
    }
}
