using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Export.Interfaces;
using Nexmine.Application.Features.Issues.Dtos;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("projects/{identifier}/issues/export")]
    [ProjectMember]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExportIssuesCsvAsync(string identifier, [FromQuery] IssueFilterParams filter)
    {
        var csv = await _exportService.ExportIssuesToCsvAsync(identifier, filter);
        var fileName = $"issues_{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(csv, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("issues/{id:int}/export/pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportIssuePdfAsync(int id)
    {
        var pdf = await _exportService.ExportIssueToPdfAsync(id);
        var fileName = $"issue_{id}.pdf";
        return File(pdf, "application/pdf", fileName);
    }

    [HttpGet("projects/{identifier}/issues/export/pdf")]
    [ProjectMember]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExportIssueListPdfAsync(string identifier, [FromQuery] IssueFilterParams filter)
    {
        var pdf = await _exportService.ExportIssueListToPdfAsync(identifier, filter);
        var fileName = $"issues_{DateTime.UtcNow:yyyy-MM-dd}.pdf";
        return File(pdf, "application/pdf", fileName);
    }
}
