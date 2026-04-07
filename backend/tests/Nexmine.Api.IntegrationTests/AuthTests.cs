using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Nexmine.Api.IntegrationTests.Fixtures;
using Nexmine.Api.IntegrationTests.Helpers;

namespace Nexmine.Api.IntegrationTests;

public class AuthTests : IClassFixture<NexmineWebApplicationFactory>
{
    private readonly NexmineWebApplicationFactory _factory;

    public AuthTests(NexmineWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_ValidData_ReturnsSuccess()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "testuser1",
            email = "testuser1@test.com",
            password = "Test1234!"
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsError()
    {
        var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "dupuser",
            email = "dup1@test.com",
            password = "Test1234!"
        });

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "dupuser",
            email = "dup2@test.com",
            password = "Test1234!"
        });

        Assert.False(response.IsSuccessStatusCode);
    }

    [Fact]
    public async Task Register_ShortPassword_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "shortpw",
            email = "shortpw@test.com",
            password = "123"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokens()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.LoginAsAdminAsync(client);

        Assert.NotEmpty(tokens.AccessToken);
        Assert.NotEmpty(tokens.RefreshToken);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "admin",
            password = "wrongpassword"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserInfo()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.LoginAsAdminAsync(client);
        AuthHelper.SetToken(client, tokens.AccessToken);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("admin", json.GetProperty("username").GetString());
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_ValidToken_ReturnsNewTokens()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.LoginAsAdminAsync(client);

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refreshToken = tokens.RefreshToken
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.NotEmpty(json.GetProperty("accessToken").GetString()!);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.LoginAsAdminAsync(client);
        AuthHelper.SetToken(client, tokens.AccessToken);

        var logoutResponse = await client.PostAsJsonAsync("/api/auth/logout", new
        {
            refreshToken = tokens.RefreshToken
        });

        Assert.True(logoutResponse.IsSuccessStatusCode);

        // Refresh with revoked token should fail
        var refreshResponse = await client.PostAsJsonAsync("/api/auth/refresh", new
        {
            refreshToken = tokens.RefreshToken
        });

        Assert.False(refreshResponse.IsSuccessStatusCode);
    }
}
