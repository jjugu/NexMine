using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class CustomFieldTrackerConfiguration : IEntityTypeConfiguration<CustomFieldTracker>
{
    public void Configure(EntityTypeBuilder<CustomFieldTracker> builder)
    {
        builder.HasKey(cft => new { cft.CustomFieldId, cft.TrackerId });

        builder.HasOne(cft => cft.CustomField)
            .WithMany(cf => cf.Trackers)
            .HasForeignKey(cft => cft.CustomFieldId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cft => cft.Tracker)
            .WithMany()
            .HasForeignKey(cft => cft.TrackerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
