using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.SavedQueries.Dtos;
using Nexmine.Application.Features.SavedQueries.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/saved-queries")]
[Authorize]
public class SavedQueriesController : ControllerBase
{
    private readonly ISavedQueryService _savedQueryService;

    public SavedQueriesController(ISavedQueryService savedQueryService)
    {
        _savedQueryService = savedQueryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<SavedQueryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync([FromQuery] int? projectId)
    {
        var userId = User.GetUserId();
        var queries = await _savedQueryService.ListAsync(userId, projectId);
        return Ok(queries);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SavedQueryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var query = await _savedQueryService.GetByIdAsync(id);

        if (query is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "저장된 필터를 찾을 수 없습니다."
            });
        }

        return Ok(query);
    }

    [HttpPost]
    [ProducesResponseType(typeof(SavedQueryDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateSavedQueryRequest request)
    {
        var userId = User.GetUserId();
        var query = await _savedQueryService.CreateAsync(request, userId);
        return CreatedAtAction("GetById", "SavedQueries", new { id = query.Id }, query);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(SavedQueryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateSavedQueryRequest request)
    {
        var userId = User.GetUserId();
        var query = await _savedQueryService.UpdateAsync(id, request, userId);

        if (query is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "저장된 필터를 찾을 수 없습니다."
            });
        }

        return Ok(query);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var userId = User.GetUserId();
        var success = await _savedQueryService.DeleteAsync(id, userId);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "저장된 필터를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
