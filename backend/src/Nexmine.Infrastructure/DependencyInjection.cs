using Microsoft.Extensions.DependencyInjection;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Application.Features.Projects.Interfaces;
using Nexmine.Infrastructure.Services;

namespace Nexmine.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectMemberService, ProjectMemberService>();

        return services;
    }
}
