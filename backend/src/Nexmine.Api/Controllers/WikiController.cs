using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Wiki.Dtos;
using Nexmine.Application.Features.Wiki.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/wiki")]
[Authorize]
public class WikiController : ControllerBase
{
    private readonly IWikiService _wikiService;

    public WikiController(IWikiService wikiService)
    {
        _wikiService = wikiService;
    }

    [HttpGet]
    [ProjectMember]
    [ProducesResponseType(typeof(List<WikiPageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(string identifier)
    {
        var pages = await _wikiService.ListAsync(identifier);
        return Ok(pages);
    }

    [HttpPost]
    [ProjectMember]
    [ProducesResponseType(typeof(WikiPageDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateWikiPageRequest request)
    {
        var userId = User.GetUserId();
        var page = await _wikiService.CreateAsync(identifier, request, userId);
        return CreatedAtAction("GetBySlug", "Wiki", new { identifier, slug = page.Slug }, page);
    }

    [HttpGet("{slug}")]
    [ProjectMember]
    [ProducesResponseType(typeof(WikiPageDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBySlugAsync(string identifier, string slug)
    {
        var page = await _wikiService.GetBySlugAsync(identifier, slug);

        if (page is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "위키 페이지를 찾을 수 없습니다."
            });
        }

        return Ok(page);
    }

    [HttpPut("{slug}")]
    [ProjectMember]
    [ProducesResponseType(typeof(WikiPageDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAsync(string identifier, string slug, [FromBody] UpdateWikiPageRequest request)
    {
        var userId = User.GetUserId();
        var page = await _wikiService.UpdateAsync(identifier, slug, request, userId);

        if (page is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "위키 페이지를 찾을 수 없습니다."
            });
        }

        return Ok(page);
    }

    [HttpDelete("{slug}")]
    [ProjectMember]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAsync(string identifier, string slug)
    {
        var success = await _wikiService.DeleteAsync(identifier, slug);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "위키 페이지를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    [HttpGet("{slug}/versions")]
    [ProjectMember]
    [ProducesResponseType(typeof(List<WikiPageVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVersionsAsync(string identifier, string slug)
    {
        var versions = await _wikiService.GetVersionsAsync(identifier, slug);
        return Ok(versions);
    }

    [HttpGet("{slug}/versions/{version:int}")]
    [ProjectMember]
    [ProducesResponseType(typeof(WikiPageVersionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVersionAsync(string identifier, string slug, int version)
    {
        var pageVersion = await _wikiService.GetVersionAsync(identifier, slug, version);

        if (pageVersion is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "해당 버전의 위키 페이지를 찾을 수 없습니다."
            });
        }

        return Ok(pageVersion);
    }
}
