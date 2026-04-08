using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> builder)
    {
        builder.HasKey(up => up.Id);

        builder.Property(up => up.UserId)
            .IsRequired();

        builder.HasIndex(up => up.UserId)
            .IsUnique();

        builder.Property(up => up.Language)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(up => up.Timezone)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(up => up.PageSize)
            .IsRequired();

        builder.Property(up => up.Theme)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(up => up.User)
            .WithOne()
            .HasForeignKey<UserPreference>(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
