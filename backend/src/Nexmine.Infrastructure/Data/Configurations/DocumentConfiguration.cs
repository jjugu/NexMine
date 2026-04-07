using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Description)
            .HasColumnType("TEXT");

        builder.Property(d => d.CategoryName)
            .HasMaxLength(100);

        builder.HasIndex(d => d.ProjectId);

        builder.HasOne(d => d.Project)
            .WithMany(p => p.Documents)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Author)
            .WithMany(u => u.AuthoredDocuments)
            .HasForeignKey(d => d.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
