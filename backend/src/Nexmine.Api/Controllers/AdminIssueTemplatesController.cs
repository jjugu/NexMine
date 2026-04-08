using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.IssueTemplates.Dtos;
using Nexmine.Application.Features.IssueTemplates.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/issue-templates")]
[Authorize(Roles = "Admin")]
public class AdminIssueTemplatesController : ControllerBase
{
    private readonly IIssueTemplateService _issueTemplateService;

    public AdminIssueTemplatesController(IIssueTemplateService issueTemplateService)
    {
        _issueTemplateService = issueTemplateService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<IssueTemplateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync([FromQuery] int? trackerId, [FromQuery] int? projectId)
    {
        var templates = await _issueTemplateService.ListAsync(trackerId, projectId);
        return Ok(templates);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(IssueTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var template = await _issueTemplateService.GetByIdAsync(id);

        if (template is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 템플릿을 찾을 수 없습니다."
            });
        }

        return Ok(template);
    }

    [HttpPost]
    [ProducesResponseType(typeof(IssueTemplateDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateIssueTemplateRequest request)
    {
        var template = await _issueTemplateService.CreateAsync(request);
        return CreatedAtAction("GetById", "AdminIssueTemplates", new { id = template.Id }, template);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(IssueTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateIssueTemplateRequest request)
    {
        var template = await _issueTemplateService.UpdateAsync(id, request);

        if (template is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 템플릿을 찾을 수 없습니다."
            });
        }

        return Ok(template);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _issueTemplateService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "이슈 템플릿을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
