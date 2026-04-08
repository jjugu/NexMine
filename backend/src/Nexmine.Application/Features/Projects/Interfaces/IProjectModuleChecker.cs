namespace Nexmine.Application.Features.Projects.Interfaces;

public interface IProjectModuleChecker
{
    Task EnsureModuleEnabledAsync(string projectIdentifier, string moduleName);
}
