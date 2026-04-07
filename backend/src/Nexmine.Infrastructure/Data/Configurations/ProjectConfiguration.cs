using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Identifier)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(p => p.Identifier)
            .IsUnique();

        builder.Property(p => p.IsPublic)
            .HasDefaultValue(true);

        builder.Property(p => p.IsArchived)
            .HasDefaultValue(false);

        builder.HasMany(p => p.Members)
            .WithOne(pm => pm.Project)
            .HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
