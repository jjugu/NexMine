namespace Nexmine.Application.Features.Realtime.Interfaces;

public interface IRealtimeNotificationService
{
    /// <summary>
    /// Notify project group that a new issue was created.
    /// </summary>
    Task NotifyIssueCreatedAsync(string projectIdentifier, int issueId, string subject, string userName);

    /// <summary>
    /// Notify project group that an issue was updated.
    /// </summary>
    Task NotifyIssueUpdatedAsync(string projectIdentifier, int issueId, string subject, string userName);

    /// <summary>
    /// Notify project group that a comment was added to an issue.
    /// </summary>
    Task NotifyIssueCommentedAsync(string projectIdentifier, int issueId, string subject, string userName, string? notes);

    /// <summary>
    /// Notify users viewing an issue detail page that the issue data changed.
    /// </summary>
    Task NotifyIssueChangedAsync(int issueId, string userName);

    /// <summary>
    /// Notify a specific user directly (works on any page).
    /// </summary>
    Task NotifyUserAsync(int userId, string eventType, string message, string? projectIdentifier, int? issueId);
}
