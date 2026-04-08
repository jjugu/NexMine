namespace Nexmine.Application.Features.Integrations.Interfaces;

public interface IGoogleChatService
{
    Task<string?> GetWebhookUrlAsync(int projectId);
    Task SetWebhookUrlAsync(int projectId, string? url);
    Task SendMessageAsync(int projectId, string text);
}
