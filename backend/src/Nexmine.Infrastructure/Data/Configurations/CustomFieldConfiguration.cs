using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class CustomFieldConfiguration : IEntityTypeConfiguration<CustomField>
{
    public void Configure(EntityTypeBuilder<CustomField> builder)
    {
        builder.HasKey(cf => cf.Id);

        builder.Property(cf => cf.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(cf => cf.Customizable)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(cf => cf.Regexp)
            .HasMaxLength(255);

        builder.Property(cf => cf.PossibleValuesJson)
            .HasColumnType("TEXT");

        builder.Property(cf => cf.DefaultValue)
            .HasMaxLength(255);

        builder.Property(cf => cf.Description)
            .HasMaxLength(500);

        builder.Property(cf => cf.IsRequired)
            .HasDefaultValue(false);

        builder.Property(cf => cf.IsForAll)
            .HasDefaultValue(false);

        builder.Property(cf => cf.IsFilter)
            .HasDefaultValue(false);

        builder.HasIndex(cf => new { cf.Customizable, cf.Position });
    }
}
