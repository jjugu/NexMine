using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class IssueConfiguration : IEntityTypeConfiguration<Issue>
{
    public void Configure(EntityTypeBuilder<Issue> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Subject)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(i => i.Description)
            .HasColumnType("TEXT");

        builder.Property(i => i.DoneRatio)
            .HasDefaultValue(0);

        builder.Property(i => i.IsPrivate)
            .HasDefaultValue(false);

        builder.Property(i => i.Position)
            .HasDefaultValue(0);

        builder.Property(i => i.EstimatedHours)
            .HasColumnType("decimal(10,2)");

        builder.HasIndex(i => new { i.ProjectId, i.StatusId });
        builder.HasIndex(i => new { i.StatusId, i.Position });

        builder.HasOne(i => i.Project)
            .WithMany(p => p.Issues)
            .HasForeignKey(i => i.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Author)
            .WithMany(u => u.AuthoredIssues)
            .HasForeignKey(i => i.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.AssignedTo)
            .WithMany(u => u.AssignedIssues)
            .HasForeignKey(i => i.AssignedToId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.ParentIssue)
            .WithMany(i => i.Children)
            .HasForeignKey(i => i.ParentIssueId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(i => i.Journals)
            .WithOne(j => j.Issue)
            .HasForeignKey(j => j.IssueId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(i => i.TimeEntries)
            .WithOne(te => te.Issue)
            .HasForeignKey(te => te.IssueId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
