using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Nexmine.Api.IntegrationTests.Fixtures;
using Nexmine.Api.IntegrationTests.Helpers;

namespace Nexmine.Api.IntegrationTests;

public class ProjectTests : IClassFixture<NexmineWebApplicationFactory>
{
    private readonly NexmineWebApplicationFactory _factory;

    public ProjectTests(NexmineWebApplicationFactory factory)
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
    public async Task CreateProject_Authenticated_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Test Project",
            identifier = "test-proj-1",
            description = "A test project",
            isPublic = true
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task CreateProject_Unauthenticated_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Fail Project",
            identifier = "fail-proj"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateProject_InvalidIdentifier_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Invalid",
            identifier = "UPPER CASE!!"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetProjects_ReturnsPagedList()
    {
        var client = await CreateAuthenticatedClient();

        await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Listed Project",
            identifier = "listed-proj"
        });

        var response = await client.GetAsync("/api/projects");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("items").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GetProject_ByIdentifier_ReturnsProject()
    {
        var client = await CreateAuthenticatedClient();

        await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Get By Id",
            identifier = "get-by-id"
        });

        var response = await client.GetAsync("/api/projects/get-by-id");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("get-by-id", json.GetProperty("identifier").GetString());
    }

    [Fact]
    public async Task UpdateProject_ChangeName_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();

        await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Before Update",
            identifier = "update-proj"
        });

        var response = await client.PutAsJsonAsync("/api/projects/update-proj", new
        {
            name = "After Update"
        });

        Assert.True(response.IsSuccessStatusCode);
    }

    [Fact]
    public async Task GetProject_NotFound_Returns404()
    {
        var client = await CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/projects/nonexistent");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddMember_ValidUser_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();

        await client.PostAsJsonAsync("/api/projects", new
        {
            name = "Member Project",
            identifier = "member-proj"
        });

        // Register a new user
        await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "memberuser",
            email = "member@test.com",
            password = "Test1234!"
        });

        // Get user list to find the new user ID
        var usersResponse = await client.GetAsync("/api/admin/users");
        var usersJson = await usersResponse.Content.ReadFromJsonAsync<JsonElement>();
        var users = usersJson.GetProperty("items");
        var memberId = 0;
        foreach (var user in users.EnumerateArray())
        {
            if (user.GetProperty("username").GetString() == "memberuser")
            {
                memberId = user.GetProperty("id").GetInt32();
                break;
            }
        }

        var response = await client.PostAsJsonAsync("/api/projects/member-proj/members", new
        {
            userId = memberId,
            roleId = 1
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }
}
