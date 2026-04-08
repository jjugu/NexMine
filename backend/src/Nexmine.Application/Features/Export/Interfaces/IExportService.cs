using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Reports.Dtos;

namespace Nexmine.Application.Features.Export.Interfaces;

public interface IExportService
{
    Task<byte[]> ExportIssuesToCsvAsync(string projectIdentifier, IssueFilterParams filter);
    Task<byte[]> ExportTimeReportToCsvAsync(TimeReportFilterParams filter);
    Task<byte[]> ExportIssueToPdfAsync(int issueId);
    Task<byte[]> ExportIssueListToPdfAsync(string projectIdentifier, IssueFilterParams filter);
}
