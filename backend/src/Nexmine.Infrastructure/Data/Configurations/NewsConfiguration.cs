using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class NewsConfiguration : IEntityTypeConfiguration<News>
{
    public void Configure(EntityTypeBuilder<News> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Summary)
            .HasMaxLength(500);

        builder.Property(n => n.Description)
            .HasColumnType("TEXT");

        builder.HasIndex(n => new { n.ProjectId, n.CreatedAt })
            .IsDescending(false, true);

        builder.HasOne(n => n.Project)
            .WithMany(p => p.News)
            .HasForeignKey(n => n.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Author)
            .WithMany(u => u.AuthoredNews)
            .HasForeignKey(n => n.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
