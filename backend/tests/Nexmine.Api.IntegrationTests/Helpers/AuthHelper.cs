using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Nexmine.Api.IntegrationTests.Helpers;

public static class AuthHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task<AuthTokens> LoginAsAdminAsync(HttpClient client)
    {
        return await LoginAsync(client, "admin", "admin");
    }

    public static async Task<AuthTokens> RegisterAndLoginAsync(HttpClient client, string username, string password = "Test1234!")
    {
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            email = $"{username}@test.com",
            password
        });
        registerResponse.EnsureSuccessStatusCode();

        return await LoginAsync(client, username, password);
    }

    public static async Task<AuthTokens> LoginAsync(HttpClient client, string username, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username,
            password
        });
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return new AuthTokens
        {
            AccessToken = json.GetProperty("accessToken").GetString()!,
            RefreshToken = json.GetProperty("refreshToken").GetString()!
        };
    }

    public static void SetToken(HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
    }
}

public class AuthTokens
{
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";
}
