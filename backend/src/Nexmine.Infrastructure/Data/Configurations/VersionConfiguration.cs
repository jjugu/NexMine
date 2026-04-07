using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Enums;
using Version = Nexmine.Domain.Entities.Version;

namespace Nexmine.Infrastructure.Data.Configurations;

public class VersionConfiguration : IEntityTypeConfiguration<Version>
{
    public void Configure(EntityTypeBuilder<Version> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(v => v.Status)
            .HasDefaultValue(VersionStatus.Open);

        builder.HasIndex(v => v.ProjectId);

        builder.HasOne(v => v.Project)
            .WithMany(p => p.Versions)
            .HasForeignKey(v => v.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.Issues)
            .WithOne(i => i.Version)
            .HasForeignKey(i => i.VersionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
