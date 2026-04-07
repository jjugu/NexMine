using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/issues/{issueId:int}/journals")]
[Authorize]
public class IssueJournalsController : ControllerBase
{
    private readonly IJournalService _journalService;

    public IssueJournalsController(IJournalService journalService)
    {
        _journalService = journalService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<JournalDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAsync(int issueId)
    {
        var journals = await _journalService.ListByIssueAsync(issueId);
        return Ok(journals);
    }

    [HttpPost]
    [ProducesResponseType(typeof(JournalDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAsync(int issueId, [FromBody] CreateJournalRequest request)
    {
        var userId = User.GetUserId();
        var journal = await _journalService.AddJournalAsync(issueId, request, userId);
        return CreatedAtAction("List", new { issueId }, journal);
    }
}
