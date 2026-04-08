using Nexmine.Application.Features.Charts.Dtos;

namespace Nexmine.Application.Features.Charts.Interfaces;

public interface IChartService
{
    Task<IssueTrendDto> GetIssueTrendAsync(string projectIdentifier, int days);
    Task<BurndownDto> GetBurndownAsync(string projectIdentifier, int versionId);
}
