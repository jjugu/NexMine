using Microsoft.EntityFrameworkCore;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Seed;


public static class SeedData
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        var utcNow = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Role>().HasData(
            new Role
            {
                Id = 1,
                Name = "Manager",
                PermissionsJson = "[\"project.manage\",\"issue.manage\",\"member.manage\"]",
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            },
            new Role
            {
                Id = 2,
                Name = "Developer",
                PermissionsJson = "[\"issue.create\",\"issue.edit\",\"issue.comment\"]",
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            },
            new Role
            {
                Id = 3,
                Name = "Reporter",
                PermissionsJson = "[\"issue.create\",\"issue.comment\"]",
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            }
        );

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@nexmine.local",
                PasswordHash = "$2a$12$7qJhRL7pDnFSqtZT8VXbpeqc.YrhFinOLbvo747FwwKR5Jx3iz3uO",
                FirstName = "System",
                LastName = "Admin",
                IsAdmin = true,
                IsActive = true,
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            }
        );

        modelBuilder.Entity<Tracker>().HasData(
            new Tracker { Id = 1, Name = "Bug", Position = 1, IsDefault = true, CreatedAt = utcNow, UpdatedAt = utcNow },
            new Tracker { Id = 2, Name = "Feature", Position = 2, IsDefault = false, CreatedAt = utcNow, UpdatedAt = utcNow },
            new Tracker { Id = 3, Name = "Task", Position = 3, IsDefault = false, CreatedAt = utcNow, UpdatedAt = utcNow },
            new Tracker { Id = 4, Name = "Support", Position = 4, IsDefault = false, CreatedAt = utcNow, UpdatedAt = utcNow }
        );

        modelBuilder.Entity<IssueStatus>().HasData(
            new IssueStatus { Id = 1, Name = "New", IsClosed = false, Position = 1, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssueStatus { Id = 2, Name = "InProgress", IsClosed = false, Position = 2, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssueStatus { Id = 3, Name = "Resolved", IsClosed = false, Position = 3, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssueStatus { Id = 4, Name = "Feedback", IsClosed = false, Position = 4, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssueStatus { Id = 5, Name = "Closed", IsClosed = true, Position = 5, CreatedAt = utcNow, UpdatedAt = utcNow }
        );

        modelBuilder.Entity<IssuePriority>().HasData(
            new IssuePriority { Id = 1, Name = "Low", IsDefault = false, Position = 1, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssuePriority { Id = 2, Name = "Normal", IsDefault = true, Position = 2, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssuePriority { Id = 3, Name = "High", IsDefault = false, Position = 3, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssuePriority { Id = 4, Name = "Urgent", IsDefault = false, Position = 4, CreatedAt = utcNow, UpdatedAt = utcNow },
            new IssuePriority { Id = 5, Name = "Immediate", IsDefault = false, Position = 5, CreatedAt = utcNow, UpdatedAt = utcNow }
        );

        modelBuilder.Entity<SystemSetting>().HasData(
            new SystemSetting { Id = 1, Key = "registration_mode", Value = "open", CreatedAt = utcNow, UpdatedAt = utcNow }
        );
    }
}
