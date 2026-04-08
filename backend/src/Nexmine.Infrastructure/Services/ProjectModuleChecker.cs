using Nexmine.Application.Features.Projects.Interfaces;

namespace Nexmine.Infrastructure.Services;

public class ProjectModuleChecker : IProjectModuleChecker
{
    private readonly IProjectService _projectService;

    public ProjectModuleChecker(IProjectService projectService)
    {
        _projectService = projectService;
    }

    public async Task EnsureModuleEnabledAsync(string projectIdentifier, string moduleName)
    {
        var enabled = await _projectService.IsModuleEnabledAsync(projectIdentifier, moduleName);
        if (!enabled)
        {
            throw new KeyNotFoundException("해당 모듈이 비활성화되어 있습니다.");
        }
    }
}
