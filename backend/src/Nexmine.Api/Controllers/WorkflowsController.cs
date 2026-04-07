using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Workflows.Dtos;
using Nexmine.Application.Features.Workflows.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class WorkflowsController : ControllerBase
{
    private readonly IWorkflowService _workflowService;

    public WorkflowsController(IWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpGet("api/issues/{issueId:int}/allowed-statuses")]
    [ProducesResponseType(typeof(List<AllowedStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAllowedStatusesAsync(int issueId)
    {
        var userId = User.GetUserId();
        var statuses = await _workflowService.GetAllowedStatusesAsync(issueId, userId);
        return Ok(statuses);
    }
}
