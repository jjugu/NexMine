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
        var userId = User.GetUserId();
        var issue = await _issueService.GetByIdAsync(id, userId);

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

    [HttpPut("{id:int}/position")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePositionAsync(int id, [FromBody] UpdateIssuePositionRequest request)
    {
        var userId = User.GetUserId();
        var issue = await _issueService.UpdatePositionAsync(id, request, userId);

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

    [HttpPut("bulk-update")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> BulkUpdateAsync([FromBody] BulkUpdateIssuesRequest request)
    {
        var userId = User.GetUserId();
        var updatedCount = await _issueService.BulkUpdateAsync(request, userId);
        return Ok(new { updatedCount });
    }

    [HttpPost("{id:int}/copy")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CopyIssueAsync(int id, [FromBody] CopyIssueRequest request)
    {
        var userId = User.GetUserId();
        var copy = await _issueService.CopyIssueAsync(id, request, userId);
        return CreatedAtAction("GetById", "Issues", new { id = copy.Id }, copy);
    }

    [HttpPut("{id:int}/move")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MoveIssueAsync(int id, [FromBody] MoveIssueRequest request)
    {
        var userId = User.GetUserId();
        var issue = await _issueService.MoveIssueAsync(id, request, userId);
        return Ok(issue);
    }

    [HttpPost("/api/projects/{identifier}/issues/import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ImportIssuesResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportIssuesAsync(string identifier, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "잘못된 요청",
                Detail = "CSV 파일을 선택해주세요."
            });
        }

        var userId = User.GetUserId();
        using var stream = file.OpenReadStream();
        var result = await _issueService.ImportFromCsvAsync(identifier, stream, userId);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var userId = User.GetUserId();
        var success = await _issueService.DeleteAsync(id, userId);

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
