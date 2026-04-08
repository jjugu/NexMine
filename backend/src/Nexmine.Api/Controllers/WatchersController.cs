using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Watchers.Dtos;
using Nexmine.Application.Features.Watchers.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class WatchersController : ControllerBase
{
    private readonly IWatcherService _watcherService;
    private const string WatchableType = "issue";

    public WatchersController(IWatcherService watcherService)
    {
        _watcherService = watcherService;
    }

    [HttpGet("/api/issues/{issueId:int}/watchers")]
    [ProducesResponseType(typeof(List<WatcherDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWatchersAsync(int issueId)
    {
        var watchers = await _watcherService.GetWatchersAsync(WatchableType, issueId);
        return Ok(watchers);
    }

    [HttpPost("/api/issues/{issueId:int}/watchers")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddWatcherAsync(int issueId, [FromBody] AddWatcherRequest request)
    {
        await _watcherService.AddWatcherAsync(WatchableType, issueId, request.UserId);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpDelete("/api/issues/{issueId:int}/watchers/{userId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveWatcherAsync(int issueId, int userId)
    {
        await _watcherService.RemoveWatcherAsync(WatchableType, issueId, userId);
        return NoContent();
    }

    [HttpGet("/api/issues/{issueId:int}/watchers/me")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> IsWatchingAsync(int issueId)
    {
        var userId = User.GetUserId();
        var isWatching = await _watcherService.IsWatchingAsync(WatchableType, issueId, userId);
        return Ok(new { isWatching });
    }

    [HttpPost("/api/issues/{issueId:int}/watchers/me")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> WatchAsync(int issueId)
    {
        var userId = User.GetUserId();
        await _watcherService.AddWatcherAsync(WatchableType, issueId, userId);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpDelete("/api/issues/{issueId:int}/watchers/me")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UnwatchAsync(int issueId)
    {
        var userId = User.GetUserId();
        await _watcherService.RemoveWatcherAsync(WatchableType, issueId, userId);
        return NoContent();
    }
}
