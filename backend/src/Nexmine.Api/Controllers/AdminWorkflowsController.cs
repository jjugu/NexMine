using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Workflows.Dtos;
using Nexmine.Application.Features.Workflows.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/workflows")]
[Authorize(Roles = "Admin")]
public class AdminWorkflowsController : ControllerBase
{
    private readonly IWorkflowService _workflowService;

    public AdminWorkflowsController(IWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<WorkflowTransitionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransitionsAsync([FromQuery] int roleId, [FromQuery] int trackerId)
    {
        var transitions = await _workflowService.GetTransitionsAsync(roleId, trackerId);
        return Ok(transitions);
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateTransitionsAsync([FromBody] UpdateWorkflowRequest request)
    {
        await _workflowService.UpdateTransitionsAsync(request);
        return Ok();
    }
}
