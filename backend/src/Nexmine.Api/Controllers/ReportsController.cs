using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Export.Interfaces;
using Nexmine.Application.Features.Reports.Dtos;
using Nexmine.Application.Features.Reports.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IExportService _exportService;

    public ReportsController(IReportService reportService, IExportService exportService)
    {
        _reportService = reportService;
        _exportService = exportService;
    }

    [HttpGet("time")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(TimeReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimeReportAsync([FromQuery] TimeReportFilterParams filter)
    {
        var report = await _reportService.GetTimeReportAsync(filter);
        return Ok(report);
    }

    [HttpGet("time/export")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportTimeReportCsvAsync([FromQuery] TimeReportFilterParams filter)
    {
        var csv = await _exportService.ExportTimeReportToCsvAsync(filter);
        var fileName = $"time-report_{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(csv, "text/csv; charset=utf-8", fileName);
    }
}
