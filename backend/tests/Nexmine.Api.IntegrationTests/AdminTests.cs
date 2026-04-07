using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Nexmine.Api.IntegrationTests.Fixtures;
using Nexmine.Api.IntegrationTests.Helpers;

namespace Nexmine.Api.IntegrationTests;

public class AdminTests : IClassFixture<NexmineWebApplicationFactory>
{
    private readonly NexmineWebApplicationFactory _factory;

    public AdminTests(NexmineWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.LoginAsAdminAsync(client);
        AuthHelper.SetToken(client, tokens.AccessToken);
        return client;
    }

    [Fact]
    public async Task AdminUsers_NonAdmin_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var tokens = await AuthHelper.RegisterAndLoginAsync(client, "nonadmin1");
        AuthHelper.SetToken(client, tokens.AccessToken);

        var response = await client.GetAsync("/api/admin/users");

        Assert.True(response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AdminUsers_Admin_ReturnsList()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("items").GetArrayLength() > 0);
    }

    [Fact]
    public async Task AdminTrackers_GetList_ReturnsSeedData()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/admin/trackers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        // Admin endpoints return arrays directly or paged objects
        var count = json.ValueKind == JsonValueKind.Array
            ? json.GetArrayLength()
            : json.GetProperty("items").GetArrayLength();
        Assert.True(count >= 4);
    }

    [Fact]
    public async Task AdminTrackers_Create_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/api/admin/trackers", new
        {
            name = "Epic"
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task AdminStatuses_GetList_ReturnsSeedData()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/admin/issue-statuses");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var count = json.ValueKind == JsonValueKind.Array
            ? json.GetArrayLength()
            : json.GetProperty("items").GetArrayLength();
        Assert.True(count >= 5);
    }

    [Fact]
    public async Task AdminPriorities_GetList_ReturnsSeedData()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/admin/issue-priorities");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var count = json.ValueKind == JsonValueKind.Array
            ? json.GetArrayLength()
            : json.GetProperty("items").GetArrayLength();
        Assert.True(count >= 5);
    }

    [Fact]
    public async Task AdminRoles_CRUD_WorksCorrectly()
    {
        var client = await CreateAuthenticatedClient();

        // Create
        var createResponse = await client.PostAsJsonAsync("/api/admin/roles", new
        {
            name = "Tester"
        });
        Assert.True(createResponse.IsSuccessStatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var roleId = created.GetProperty("id").GetInt32();

        // Update
        var updateResponse = await client.PutAsJsonAsync($"/api/admin/roles/{roleId}", new
        {
            name = "QA Tester"
        });
        Assert.True(updateResponse.IsSuccessStatusCode);

        // Delete
        var deleteResponse = await client.DeleteAsync($"/api/admin/roles/{roleId}");
        Assert.True(deleteResponse.IsSuccessStatusCode);
    }

    [Fact]
    public async Task AdminCreateUser_ValidData_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/api/admin/users", new
        {
            username = "adminCreated",
            email = "admincreated@test.com",
            password = "Test1234!",
            isAdmin = false
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task AdminCreateTracker_EmptyName_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/api/admin/trackers", new
        {
            name = ""
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
