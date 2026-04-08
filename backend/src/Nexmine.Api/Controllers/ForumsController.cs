using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Forums.Dtos;
using Nexmine.Application.Features.Forums.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ForumsController : ControllerBase
{
    private readonly IForumService _forumService;

    public ForumsController(IForumService forumService)
    {
        _forumService = forumService;
    }

    // ── Forum CRUD ──────────────────────────────────────────────

    [HttpGet("projects/{identifier}/forums")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<ForumDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListForumsAsync(string identifier)
    {
        var forums = await _forumService.ListForumsAsync(identifier);
        return Ok(forums);
    }

    [HttpPost("projects/{identifier}/forums")]
    [ProjectMember]
    [ProducesResponseType(typeof(ForumDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateForumAsync(string identifier, [FromBody] CreateForumRequest request)
    {
        var forum = await _forumService.CreateForumAsync(identifier, request);
        return CreatedAtAction("ListForums", "Forums", new { identifier }, forum);
    }

    [HttpPut("forums/{id:int}")]
    [ProducesResponseType(typeof(ForumDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateForumAsync(int id, [FromBody] CreateForumRequest request)
    {
        var forum = await _forumService.UpdateForumAsync(id, request);

        if (forum is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "포럼을 찾을 수 없습니다."
            });
        }

        return Ok(forum);
    }

    [HttpDelete("forums/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteForumAsync(int id)
    {
        var success = await _forumService.DeleteForumAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "포럼을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    // ── Topic CRUD ──────────────────────────────────────────────

    [HttpGet("forums/{forumId:int}/topics")]
    [ProducesResponseType(typeof(List<ForumTopicDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListTopicsAsync(int forumId)
    {
        var topics = await _forumService.ListTopicsAsync(forumId);
        return Ok(topics);
    }

    [HttpGet("forum-topics/{id:int}")]
    [ProducesResponseType(typeof(ForumTopicDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTopicAsync(int id)
    {
        var topic = await _forumService.GetTopicAsync(id);

        if (topic is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "주제를 찾을 수 없습니다."
            });
        }

        return Ok(topic);
    }

    [HttpPost("forums/{forumId:int}/topics")]
    [ProducesResponseType(typeof(ForumTopicDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateTopicAsync(int forumId, [FromBody] CreateTopicRequest request)
    {
        var userId = User.GetUserId();
        var topic = await _forumService.CreateTopicAsync(forumId, request, userId);
        return CreatedAtAction("GetTopic", "Forums", new { id = topic.Id }, topic);
    }

    [HttpPut("forum-topics/{id:int}")]
    [ProducesResponseType(typeof(ForumTopicDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTopicAsync(int id, [FromBody] UpdateTopicRequest request)
    {
        var topic = await _forumService.UpdateTopicAsync(id, request);

        if (topic is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "주제를 찾을 수 없습니다."
            });
        }

        return Ok(topic);
    }

    [HttpDelete("forum-topics/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTopicAsync(int id)
    {
        var success = await _forumService.DeleteTopicAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "주제를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    // ── Reply CRUD ──────────────────────────────────────────────

    [HttpPost("forum-topics/{topicId:int}/replies")]
    [ProducesResponseType(typeof(ForumReplyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateReplyAsync(int topicId, [FromBody] CreateReplyRequest request)
    {
        var userId = User.GetUserId();
        var reply = await _forumService.CreateReplyAsync(topicId, request, userId);
        return CreatedAtAction("GetTopic", "Forums", new { id = topicId }, reply);
    }

    [HttpDelete("forum-replies/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteReplyAsync(int id)
    {
        var success = await _forumService.DeleteReplyAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "답글을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
