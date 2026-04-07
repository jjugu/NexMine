using Nexmine.Application.Features.Reports.Dtos;

namespace Nexmine.Application.Features.Reports.Interfaces;

public interface IReportService
{
    Task<TimeReportDto> GetTimeReportAsync(TimeReportFilterParams filter);
}
