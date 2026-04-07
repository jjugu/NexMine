using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class JournalConfiguration : IEntityTypeConfiguration<Journal>
{
    public void Configure(EntityTypeBuilder<Journal> builder)
    {
        builder.HasKey(j => j.Id);

        builder.Property(j => j.Notes)
            .HasColumnType("TEXT");

        builder.HasIndex(j => j.IssueId);

        builder.HasOne(j => j.User)
            .WithMany(u => u.Journals)
            .HasForeignKey(j => j.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(j => j.Details)
            .WithOne(d => d.Journal)
            .HasForeignKey(d => d.JournalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
