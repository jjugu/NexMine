using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ForumTopicConfiguration : IEntityTypeConfiguration<ForumTopic>
{
    public void Configure(EntityTypeBuilder<ForumTopic> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Subject)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(t => t.Content)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.HasIndex(t => new { t.ForumId, t.IsSticky, t.LastReplyAt })
            .IsDescending(false, true, true);

        builder.HasOne(t => t.Forum)
            .WithMany(f => f.Topics)
            .HasForeignKey(t => t.ForumId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Author)
            .WithMany(u => u.ForumTopics)
            .HasForeignKey(t => t.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
