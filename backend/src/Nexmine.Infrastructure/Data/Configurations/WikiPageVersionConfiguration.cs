using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class WikiPageVersionConfiguration : IEntityTypeConfiguration<WikiPageVersion>
{
    public void Configure(EntityTypeBuilder<WikiPageVersion> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(v => v.ContentHtml)
            .HasColumnType("TEXT");

        builder.Property(v => v.Comments)
            .HasMaxLength(500);

        builder.HasIndex(v => new { v.WikiPageId, v.Version });

        builder.HasOne(v => v.EditedBy)
            .WithMany(u => u.WikiPageEdits)
            .HasForeignKey(v => v.EditedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
