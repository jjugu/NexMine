using Microsoft.EntityFrameworkCore;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data.Seed;
using Version = Nexmine.Domain.Entities.Version;

namespace Nexmine.Infrastructure.Data;

public class NexmineDbContext : DbContext
{
    public NexmineDbContext(DbContextOptions<NexmineDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMembership> ProjectMemberships => Set<ProjectMembership>();
    public DbSet<Tracker> Trackers => Set<Tracker>();
    public DbSet<IssueStatus> IssueStatuses => Set<IssueStatus>();
    public DbSet<IssuePriority> IssuePriorities => Set<IssuePriority>();
    public DbSet<IssueCategory> IssueCategories => Set<IssueCategory>();
    public DbSet<Version> Versions => Set<Version>();
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<Journal> Journals => Set<Journal>();
    public DbSet<JournalDetail> JournalDetails => Set<JournalDetail>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<IssueRelation> IssueRelations => Set<IssueRelation>();
    public DbSet<WikiPage> WikiPages => Set<WikiPage>();
    public DbSet<WikiPageVersion> WikiPageVersions => Set<WikiPageVersion>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<CustomField> CustomFields => Set<CustomField>();
    public DbSet<CustomValue> CustomValues => Set<CustomValue>();
    public DbSet<CustomFieldProject> CustomFieldProjects => Set<CustomFieldProject>();
    public DbSet<CustomFieldTracker> CustomFieldTrackers => Set<CustomFieldTracker>();
    public DbSet<WorkflowTransition> WorkflowTransitions => Set<WorkflowTransition>();
    public DbSet<Watcher> Watchers => Set<Watcher>();
    public DbSet<UserDashboardWidget> UserDashboardWidgets => Set<UserDashboardWidget>();
    public DbSet<News> News => Set<News>();
    public DbSet<IssueTemplate> IssueTemplates => Set<IssueTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NexmineDbContext).Assembly);
        SeedData.Apply(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
