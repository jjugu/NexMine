using Microsoft.Extensions.DependencyInjection;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Application.Features.Dashboard.Interfaces;
using Nexmine.Application.Features.Documents.Interfaces;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Application.Features.Projects.Interfaces;
using Nexmine.Application.Features.Wiki.Interfaces;
using Nexmine.Infrastructure.Services;

namespace Nexmine.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string uploadsPath)
    {
        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectMemberService, ProjectMemberService>();
        services.AddScoped<IIssueService, IssueService>();
        services.AddScoped<IJournalService, JournalService>();
        services.AddScoped<ITimeEntryService, TimeEntryService>();
        services.AddScoped<IVersionService, VersionService>();
        services.AddScoped<IIssueCategoryService, IssueCategoryService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IIssueRelationService, IssueRelationService>();
        services.AddScoped<IGanttService, GanttService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IWikiService, WikiService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddSingleton<IFileStorageService>(_ => new FileStorageService(uploadsPath));

        return services;
    }
}
