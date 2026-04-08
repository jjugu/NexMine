using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class WatcherConfiguration : IEntityTypeConfiguration<Watcher>
{
    public void Configure(EntityTypeBuilder<Watcher> builder)
    {
        builder.HasKey(w => new { w.WatchableType, w.WatchableId, w.UserId });

        builder.Property(w => w.WatchableType)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(w => new { w.WatchableType, w.WatchableId });

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
