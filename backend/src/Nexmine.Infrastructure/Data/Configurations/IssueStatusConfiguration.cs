using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class IssueStatusConfiguration : IEntityTypeConfiguration<IssueStatus>
{
    public void Configure(EntityTypeBuilder<IssueStatus> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.Name)
            .IsUnique();

        builder.Property(s => s.IsClosed)
            .HasDefaultValue(false);

        builder.HasMany(s => s.Issues)
            .WithOne(i => i.Status)
            .HasForeignKey(i => i.StatusId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
