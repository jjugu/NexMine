using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.News.Dtos;
using Nexmine.Application.Features.News.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService)
    {
        _newsService = newsService;
    }

    [HttpGet("api/projects/{identifier}/news")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<NewsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(string identifier)
    {
        var news = await _newsService.ListAsync(identifier);
        return Ok(news);
    }

    [HttpGet("api/news/{id:int}")]
    [ProducesResponseType(typeof(NewsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var news = await _newsService.GetByIdAsync(id);

        if (news is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "뉴스를 찾을 수 없습니다."
            });
        }

        return Ok(news);
    }

    [HttpPost("api/projects/{identifier}/news")]
    [ProjectMember]
    [ProducesResponseType(typeof(NewsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateNewsRequest request)
    {
        var userId = User.GetUserId();
        var news = await _newsService.CreateAsync(identifier, request, userId);
        return CreatedAtAction("GetById", "News", new { id = news.Id }, news);
    }

    [HttpPut("api/news/{id:int}")]
    [ProducesResponseType(typeof(NewsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateNewsRequest request)
    {
        var news = await _newsService.UpdateAsync(id, request);

        if (news is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "뉴스를 찾을 수 없습니다."
            });
        }

        return Ok(news);
    }

    [HttpDelete("api/news/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _newsService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "뉴스를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
