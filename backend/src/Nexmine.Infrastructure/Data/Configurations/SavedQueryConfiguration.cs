using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class SavedQueryConfiguration : IEntityTypeConfiguration<SavedQuery>
{
    public void Configure(EntityTypeBuilder<SavedQuery> builder)
    {
        builder.HasKey(q => q.Id);

        builder.Property(q => q.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(q => q.FiltersJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.HasIndex(q => new { q.UserId, q.ProjectId });

        builder.HasOne(q => q.User)
            .WithMany()
            .HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(q => q.Project)
            .WithMany()
            .HasForeignKey(q => q.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
