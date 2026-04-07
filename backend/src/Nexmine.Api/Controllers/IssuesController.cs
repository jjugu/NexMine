using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssuesController : ControllerBase
{
    private readonly IIssueService _issueService;

    public IssuesController(IIssueService issueService)
    {
        _issueService = issueService;
    }

    [HttpGet("/api/projects/{identifier}/issues")]
    [ProjectMember]
    [ProducesResponseType(typeof(Application.Common.Models.PagedResult<IssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByProjectAsync(string identifier, [FromQuery] IssueFilterParams filterParams)
    {
        var result = await _issueService.ListAsync(identifier, filterParams);
        return Ok(result);
    }

    [HttpPost("/api/projects/{identifier}/issues")]
    [ProjectMember]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateIssueRequest request)
    {
        var userId = User.GetUserId();
        var issue = await _issueService.CreateAsync(identifier, request, userId);
        return CreatedAtAction("GetById", "Issues", new { id = issue.Id }, issue);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var issue = await _issueService.GetByIdAsync(id);

        if (issue is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "일감을 찾을 수 없습니다."
            });
        }

        return Ok(issue);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateIssueRequest request)
    {
        var userId = User.GetUserId();
        var issue = await _issueService.UpdateAsync(id, request, userId);

        if (issue is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "일감을 찾을 수 없습니다."
            });
        }

        return Ok(issue);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _issueService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "일감을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
