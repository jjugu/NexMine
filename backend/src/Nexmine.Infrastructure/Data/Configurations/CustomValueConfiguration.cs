using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class CustomValueConfiguration : IEntityTypeConfiguration<CustomValue>
{
    public void Configure(EntityTypeBuilder<CustomValue> builder)
    {
        builder.HasKey(cv => cv.Id);

        builder.Property(cv => cv.CustomizableType)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(cv => cv.Value)
            .HasColumnType("TEXT");

        builder.HasIndex(cv => new { cv.CustomFieldId, cv.CustomizableType, cv.CustomizableId })
            .IsUnique();

        builder.HasOne(cv => cv.CustomField)
            .WithMany(cf => cf.CustomValues)
            .HasForeignKey(cv => cv.CustomFieldId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
