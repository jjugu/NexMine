using Microsoft.Extensions.DependencyInjection;
using Nexmine.Application.Features.Activities.Interfaces;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Application.Features.CustomFields.Interfaces;
using Nexmine.Application.Features.Dashboard.Interfaces;
using Nexmine.Application.Features.Documents.Interfaces;
using Nexmine.Application.Features.Export.Interfaces;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Application.Features.IssueTemplates.Interfaces;
using Nexmine.Application.Features.MyPage.Interfaces;
using Nexmine.Application.Features.News.Interfaces;
using Nexmine.Application.Features.Projects.Interfaces;
using Nexmine.Application.Features.Reports.Interfaces;
using Nexmine.Application.Features.Roadmap.Interfaces;
using Nexmine.Application.Features.Search.Interfaces;
using Nexmine.Application.Features.Watchers.Interfaces;
using Nexmine.Application.Features.Wiki.Interfaces;
using Nexmine.Application.Features.Workflows.Interfaces;
using Nexmine.Infrastructure.Services;

namespace Nexmine.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string uploadsPath)
    {
        services.AddScoped<IActivityService, ActivityService>();
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

        // Admin services
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminRoleService, AdminRoleService>();
        services.AddScoped<IAdminTrackerService, AdminTrackerService>();
        services.AddScoped<IAdminStatusService, AdminStatusService>();
        services.AddScoped<IAdminPriorityService, AdminPriorityService>();

        // Custom fields
        services.AddScoped<ICustomFieldService, CustomFieldService>();

        // Search service
        services.AddScoped<ISearchService, SearchService>();

        // Workflow service
        services.AddScoped<IWorkflowService, WorkflowService>();

        // Watcher service
        services.AddScoped<IWatcherService, WatcherService>();

        // Export & Reports
        services.AddScoped<IExportService, ExportService>();
        services.AddScoped<IReportService, ReportService>();

        // Roadmap
        services.AddScoped<IRoadmapService, RoadmapService>();

        // My Page
        services.AddScoped<IMyPageService, MyPageService>();

        // News
        services.AddScoped<INewsService, NewsService>();

        // Issue Templates
        services.AddScoped<IIssueTemplateService, IssueTemplateService>();

        return services;
    }
}
