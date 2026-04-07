using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/issues/{issueId:int}/relations")]
[Authorize]
public class IssueRelationsController : ControllerBase
{
    private readonly IIssueRelationService _issueRelationService;

    public IssueRelationsController(IIssueRelationService issueRelationService)
    {
        _issueRelationService = issueRelationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<IssueRelationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAsync(int issueId)
    {
        var relations = await _issueRelationService.ListByIssueAsync(issueId);
        return Ok(relations);
    }

    [HttpPost]
    [ProducesResponseType(typeof(IssueRelationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAsync(int issueId, [FromBody] CreateIssueRelationRequest request)
    {
        var relation = await _issueRelationService.CreateAsync(issueId, request);
        return CreatedAtAction("List", new { issueId }, relation);
    }

    [HttpDelete("{relationId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int issueId, int relationId)
    {
        var success = await _issueRelationService.DeleteAsync(issueId, relationId);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "일감 관계를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
