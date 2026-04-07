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
