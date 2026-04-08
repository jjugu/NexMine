using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Nexmine.Application.Features.Integrations.Interfaces;
using Nexmine.Application.Features.Settings.Interfaces;

namespace Nexmine.Infrastructure.Services;

public class GoogleChatService : IGoogleChatService
{
    private readonly ISystemSettingService _settingService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GoogleChatService> _logger;

    private const string SettingKeyPrefix = "google_chat_webhook";

    public GoogleChatService(
        ISystemSettingService settingService,
        IHttpClientFactory httpClientFactory,
        ILogger<GoogleChatService> logger)
    {
        _settingService = settingService;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string?> GetWebhookUrlAsync(int projectId)
    {
        var url = await _settingService.GetAsync($"{SettingKeyPrefix}:{projectId}");
        return string.IsNullOrWhiteSpace(url) ? null : url;
    }

    public async Task SetWebhookUrlAsync(int projectId, string? url)
    {
        var key = $"{SettingKeyPrefix}:{projectId}";
        await _settingService.SetAsync(key, url?.Trim() ?? "");
    }

    public async Task SendMessageAsync(int projectId, string text)
    {
        try
        {
            var webhookUrl = await GetWebhookUrlAsync(projectId);
            if (webhookUrl is null)
                return;

            var client = _httpClientFactory.CreateClient();
            var payload = JsonSerializer.Serialize(new { text });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(webhookUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Google Chat webhook 전송 실패 - ProjectId: {ProjectId}, StatusCode: {StatusCode}",
                    projectId, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Google Chat webhook 전송 중 오류 발생 - ProjectId: {ProjectId}", projectId);
        }
    }
}
