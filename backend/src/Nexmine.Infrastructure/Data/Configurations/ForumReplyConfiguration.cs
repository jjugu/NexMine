using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ForumReplyConfiguration : IEntityTypeConfiguration<ForumReply>
{
    public void Configure(EntityTypeBuilder<ForumReply> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Content)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.HasOne(r => r.Topic)
            .WithMany(t => t.Replies)
            .HasForeignKey(r => r.TopicId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Author)
            .WithMany(u => u.ForumReplies)
            .HasForeignKey(r => r.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
