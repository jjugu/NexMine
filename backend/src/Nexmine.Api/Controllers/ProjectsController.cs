using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Integrations.Dtos;
using Nexmine.Application.Features.Integrations.Interfaces;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Application.Features.Projects.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IGoogleChatService _googleChatService;

    public ProjectsController(IProjectService projectService, IGoogleChatService googleChatService)
    {
        _projectService = projectService;
        _googleChatService = googleChatService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Application.Common.Models.PagedResult<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var userId = User.GetUserId();
        var result = await _projectService.ListAsync(page, pageSize, search, userId);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateProjectRequest request)
    {
        var userId = User.GetUserId();
        var project = await _projectService.CreateAsync(request, userId);
        return CreatedAtAction("GetByIdentifier", new { identifier = project.Identifier }, project);
    }

    [HttpGet("{identifier}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdentifierAsync(string identifier)
    {
        var userId = User.GetUserId();
        var project = await _projectService.GetByIdentifierAsync(identifier, userId);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return Ok(project);
    }

    [HttpPut("{identifier}")]
    [ProjectManager]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAsync(string identifier, [FromBody] UpdateProjectRequest request)
    {
        var project = await _projectService.UpdateAsync(identifier, request);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return Ok(project);
    }

    [HttpDelete("{identifier}")]
    [ProjectManager]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ArchiveAsync(string identifier)
    {
        var success = await _projectService.ArchiveAsync(identifier);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    [HttpPost("{identifier}/copy")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CopyProjectAsync(string identifier, [FromBody] CopyProjectRequest request)
    {
        var userId = User.GetUserId();
        var result = await _projectService.CopyProjectAsync(identifier, request, userId);
        return CreatedAtAction("GetByIdentifier", "Projects", new { identifier = result.Identifier }, result);
    }

    [HttpGet("{identifier}/modules")]
    [ProducesResponseType(typeof(ProjectModulesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetModulesAsync(string identifier)
    {
        var modules = await _projectService.GetModulesAsync(identifier);
        return Ok(modules);
    }

    [HttpPut("{identifier}/modules")]
    [ProjectManager]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateModulesAsync(string identifier, [FromBody] UpdateProjectModulesRequest request)
    {
        await _projectService.UpdateModulesAsync(identifier, request);
        var modules = await _projectService.GetModulesAsync(identifier);
        return Ok(modules);
    }

    [HttpGet("{identifier}/webhook")]
    [ProjectManager]
    [ProducesResponseType(typeof(WebhookSettingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetWebhookAsync(string identifier)
    {
        var project = await _projectService.GetByIdentifierAsync(identifier);
        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        var url = await _googleChatService.GetWebhookUrlAsync(project.Id);
        return Ok(new WebhookSettingDto { Url = url });
    }

    [HttpPut("{identifier}/webhook")]
    [ProjectManager]
    [ProducesResponseType(typeof(WebhookSettingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateWebhookAsync(string identifier, [FromBody] WebhookSettingDto request)
    {
        var project = await _projectService.GetByIdentifierAsync(identifier);
        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        await _googleChatService.SetWebhookUrlAsync(project.Id, request.Url);
        return Ok(new WebhookSettingDto { Url = request.Url });
    }

    [HttpPost("{identifier}/webhook/test")]
    [ProjectManager]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> TestWebhookAsync(string identifier)
    {
        var project = await _projectService.GetByIdentifierAsync(identifier);
        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        var url = await _googleChatService.GetWebhookUrlAsync(project.Id);
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Webhook 미설정",
                Detail = "Webhook URL이 설정되지 않았습니다. 먼저 URL을 저장해주세요."
            });
        }

        await _googleChatService.SendMessageAsync(project.Id,
            $"Nexmine 연동 테스트 메시지입니다.\n프로젝트: {project.Name}");
        return Ok(new { message = "테스트 메시지를 전송했습니다." });
    }

    [HttpPost("{identifier}/favorite")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddFavoriteAsync(string identifier)
    {
        var userId = User.GetUserId();
        var success = await _projectService.AddFavoriteAsync(identifier, userId);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return Ok(new { message = "즐겨찾기에 추가되었습니다." });
    }

    [HttpDelete("{identifier}/favorite")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFavoriteAsync(string identifier)
    {
        var userId = User.GetUserId();
        var success = await _projectService.RemoveFavoriteAsync(identifier, userId);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = $"프로젝트 '{identifier}'를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    [HttpGet("/api/my/favorites")]
    [ProducesResponseType(typeof(List<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFavoritesAsync()
    {
        var userId = User.GetUserId();
        var favorites = await _projectService.GetFavoritesAsync(userId);
        return Ok(favorites);
    }
}
