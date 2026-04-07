using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class WikiPageConfiguration : IEntityTypeConfiguration<WikiPage>
{
    public void Configure(EntityTypeBuilder<WikiPage> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(w => w.Slug)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(w => w.ContentHtml)
            .HasColumnType("TEXT");

        builder.Property(w => w.Version)
            .HasDefaultValue(1);

        builder.HasIndex(w => new { w.ProjectId, w.Slug })
            .IsUnique();

        builder.HasIndex(w => w.ProjectId);

        builder.HasOne(w => w.Project)
            .WithMany(p => p.WikiPages)
            .HasForeignKey(w => w.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.Author)
            .WithMany(u => u.AuthoredWikiPages)
            .HasForeignKey(w => w.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.ParentPage)
            .WithMany(w => w.Children)
            .HasForeignKey(w => w.ParentPageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(w => w.Versions)
            .WithOne(v => v.WikiPage)
            .HasForeignKey(v => v.WikiPageId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
