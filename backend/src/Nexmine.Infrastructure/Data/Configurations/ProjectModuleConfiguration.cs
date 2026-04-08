using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ProjectModuleConfiguration : IEntityTypeConfiguration<ProjectModule>
{
    public void Configure(EntityTypeBuilder<ProjectModule> builder)
    {
        builder.HasKey(pm => new { pm.ProjectId, pm.ModuleName });

        builder.Property(pm => pm.ModuleName)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(pm => pm.Project)
            .WithMany(p => p.Modules)
            .HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pm => pm.ProjectId);
    }
}
