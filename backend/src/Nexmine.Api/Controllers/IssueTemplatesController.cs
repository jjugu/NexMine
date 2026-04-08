using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.IssueTemplates.Dtos;
using Nexmine.Application.Features.IssueTemplates.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/issue-templates")]
[Authorize]
public class IssueTemplatesController : ControllerBase
{
    private readonly IIssueTemplateService _issueTemplateService;

    public IssueTemplatesController(IIssueTemplateService issueTemplateService)
    {
        _issueTemplateService = issueTemplateService;
    }

    [HttpGet]
    [ProjectMember]
    [ProducesResponseType(typeof(List<IssueTemplateDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(string identifier, [FromQuery] int trackerId)
    {
        var templates = await _issueTemplateService.GetForIssueCreationAsync(trackerId, identifier);
        return Ok(templates);
    }
}
