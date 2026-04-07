using Nexmine.Application.Features.Dashboard.Dtos;

namespace Nexmine.Application.Features.Dashboard.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetGlobalDashboardAsync(int userId);
    Task<ProjectDashboardDto> GetProjectDashboardAsync(string identifier, int userId);
}
