using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class IssueTemplateConfiguration : IEntityTypeConfiguration<IssueTemplate>
{
    public void Configure(EntityTypeBuilder<IssueTemplate> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.SubjectTemplate)
            .HasMaxLength(255);

        builder.Property(t => t.DescriptionTemplate)
            .HasColumnType("TEXT");

        builder.HasIndex(t => new { t.TrackerId, t.ProjectId });

        builder.HasOne(t => t.Tracker)
            .WithMany(tr => tr.IssueTemplates)
            .HasForeignKey(t => t.TrackerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Project)
            .WithMany(p => p.IssueTemplates)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
