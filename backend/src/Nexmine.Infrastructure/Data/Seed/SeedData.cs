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
    }
}
