using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ForumConfiguration : IEntityTypeConfiguration<Forum>
{
    public void Configure(EntityTypeBuilder<Forum> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Description)
            .HasMaxLength(500);

        builder.HasIndex(f => new { f.ProjectId, f.Position });

        builder.HasOne(f => f.Project)
            .WithMany(p => p.Forums)
            .HasForeignKey(f => f.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
