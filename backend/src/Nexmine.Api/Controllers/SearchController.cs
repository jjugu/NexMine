using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Search.Dtos;
using Nexmine.Application.Features.Search.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SearchResultItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchAsync(
        [FromQuery] string? q,
        [FromQuery] string scope = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "잘못된 요청",
                Detail = "검색어를 입력해 주세요."
            });
        }

        if (scope is not "all" and not "issues" and not "wiki")
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "잘못된 요청",
                Detail = "검색 범위는 all, issues, wiki 중 하나여야 합니다."
            });
        }

        var userId = User.GetUserId();
        var result = await _searchService.SearchAsync(q.Trim(), scope, userId, page, pageSize);
        return Ok(result);
    }
}
