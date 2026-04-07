using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ProjectMembershipConfiguration : IEntityTypeConfiguration<ProjectMembership>
{
    public void Configure(EntityTypeBuilder<ProjectMembership> builder)
    {
        builder.HasKey(pm => pm.Id);

        builder.HasIndex(pm => new { pm.ProjectId, pm.UserId })
            .IsUnique();
    }
}
