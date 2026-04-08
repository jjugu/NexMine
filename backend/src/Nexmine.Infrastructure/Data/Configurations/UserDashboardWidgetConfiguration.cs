using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class UserDashboardWidgetConfiguration : IEntityTypeConfiguration<UserDashboardWidget>
{
    public void Configure(EntityTypeBuilder<UserDashboardWidget> builder)
    {
        builder.Property(w => w.WidgetType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(w => w.SettingsJson)
            .HasColumnType("TEXT");

        builder.HasIndex(w => new { w.UserId, w.Position });

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
