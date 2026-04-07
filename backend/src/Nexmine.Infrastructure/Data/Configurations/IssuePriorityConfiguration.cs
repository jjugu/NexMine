using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class IssuePriorityConfiguration : IEntityTypeConfiguration<IssuePriority>
{
    public void Configure(EntityTypeBuilder<IssuePriority> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.Name)
            .IsUnique();

        builder.Property(p => p.IsDefault)
            .HasDefaultValue(false);

        builder.HasMany(p => p.Issues)
            .WithOne(i => i.Priority)
            .HasForeignKey(i => i.PriorityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
