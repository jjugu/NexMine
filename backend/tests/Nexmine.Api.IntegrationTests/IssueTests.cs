using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Nexmine.Api.IntegrationTests.Fixtures;
using Nexmine.Api.IntegrationTests.Helpers;

namespace Nexmine.Api.IntegrationTests;

public class IssueTests : IClassFixture<NexmineWebApplicationFactory>
{
    private readonly NexmineWebApplicationFactory _factory;

    public IssueTests(NexmineWebApplicationFactory factory)
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

    private async Task EnsureProjectExists(HttpClient client, string identifier)
    {
        await client.PostAsJsonAsync("/api/projects", new
        {
            name = $"Project {identifier}",
            identifier
        });
    }

    [Fact]
    public async Task CreateIssue_ValidData_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-create");

        var response = await client.PostAsJsonAsync("/api/projects/issue-create/issues", new
        {
            subject = "Test Issue",
            trackerId = 1,
            priorityId = 2,
            description = "A test issue"
        });

        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task CreateIssue_MissingSubject_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-val");

        var response = await client.PostAsJsonAsync("/api/projects/issue-val/issues", new
        {
            subject = "",
            trackerId = 1
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetIssues_ReturnsPagedList()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-list");

        await client.PostAsJsonAsync("/api/projects/issue-list/issues", new
        {
            subject = "List Issue",
            trackerId = 1
        });

        var response = await client.GetAsync("/api/projects/issue-list/issues");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("items").GetArrayLength() > 0);
    }

    [Fact]
    public async Task UpdateIssue_ChangeStatus_CreatesJournal()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-journal");

        var createResponse = await client.PostAsJsonAsync("/api/projects/issue-journal/issues", new
        {
            subject = "Journal Test Issue",
            trackerId = 1,
            statusId = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var issueId = created.GetProperty("id").GetInt32();

        // Update status
        await client.PutAsJsonAsync($"/api/issues/{issueId}", new
        {
            statusId = 2
        });

        // Check journals
        var journalsResponse = await client.GetAsync($"/api/issues/{issueId}/journals");
        Assert.True(journalsResponse.IsSuccessStatusCode);
    }

    [Fact]
    public async Task UpdateIssue_ClosedStatus_SetsDoneRatio100()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-closed");

        var createResponse = await client.PostAsJsonAsync("/api/projects/issue-closed/issues", new
        {
            subject = "Close Test Issue",
            trackerId = 1,
            statusId = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var issueId = created.GetProperty("id").GetInt32();

        // Update to Closed status (statusId=5)
        await client.PutAsJsonAsync($"/api/issues/{issueId}", new
        {
            statusId = 5
        });

        var response = await client.GetAsync($"/api/issues/{issueId}");
        var issue = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(100, issue.GetProperty("doneRatio").GetInt32());
    }

    [Fact]
    public async Task CreateIssue_DueDateBeforeStartDate_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-date");

        var response = await client.PostAsJsonAsync("/api/projects/issue-date/issues", new
        {
            subject = "Date Issue",
            trackerId = 1,
            startDate = "2026-01-10",
            dueDate = "2026-01-05"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteIssue_Existing_ReturnsSuccess()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-del");

        var createResponse = await client.PostAsJsonAsync("/api/projects/issue-del/issues", new
        {
            subject = "Delete Me",
            trackerId = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var issueId = created.GetProperty("id").GetInt32();

        var response = await client.DeleteAsync($"/api/issues/{issueId}");
        Assert.True(response.IsSuccessStatusCode,
            $"Expected success but got {response.StatusCode}");
    }

    [Fact]
    public async Task GetIssues_WithFilter_ReturnsFiltered()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-filter");

        await client.PostAsJsonAsync("/api/projects/issue-filter/issues", new
        {
            subject = "Bug Issue",
            trackerId = 1,
            priorityId = 4
        });

        await client.PostAsJsonAsync("/api/projects/issue-filter/issues", new
        {
            subject = "Feature Issue",
            trackerId = 2,
            priorityId = 2
        });

        // Get all issues
        var allResponse = await client.GetAsync("/api/projects/issue-filter/issues");
        var allJson = await allResponse.Content.ReadFromJsonAsync<JsonElement>();
        var allCount = allJson.GetProperty("items").GetArrayLength();

        // Get filtered issues (only bugs)
        var filteredResponse = await client.GetAsync("/api/projects/issue-filter/issues?trackerId=1");
        var filteredJson = await filteredResponse.Content.ReadFromJsonAsync<JsonElement>();
        var filteredCount = filteredJson.GetProperty("items").GetArrayLength();

        Assert.True(filteredCount > 0, "Filter should return at least one result");
        Assert.True(filteredCount < allCount, "Filtered results should be fewer than all results");
    }

    [Fact]
    public async Task CreateIssue_DoneRatioOutOfRange_ReturnsBadRequest()
    {
        var client = await CreateAuthenticatedClient();
        await EnsureProjectExists(client, "issue-ratio");

        var response = await client.PostAsJsonAsync("/api/projects/issue-ratio/issues", new
        {
            subject = "Bad Ratio",
            trackerId = 1,
            doneRatio = 150
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
