using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class TrackerConfiguration : IEntityTypeConfiguration<Tracker>
{
    public void Configure(EntityTypeBuilder<Tracker> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => t.Name)
            .IsUnique();

        builder.Property(t => t.IsDefault)
            .HasDefaultValue(false);

        builder.HasMany(t => t.Issues)
            .WithOne(i => i.Tracker)
            .HasForeignKey(i => i.TrackerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
