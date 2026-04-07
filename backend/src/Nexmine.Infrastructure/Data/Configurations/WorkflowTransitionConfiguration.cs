using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class WorkflowTransitionConfiguration : IEntityTypeConfiguration<WorkflowTransition>
{
    public void Configure(EntityTypeBuilder<WorkflowTransition> builder)
    {
        builder.HasKey(wt => new { wt.RoleId, wt.TrackerId, wt.OldStatusId, wt.NewStatusId });

        builder.HasIndex(wt => new { wt.RoleId, wt.TrackerId });

        builder.HasOne(wt => wt.Role)
            .WithMany()
            .HasForeignKey(wt => wt.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.Tracker)
            .WithMany()
            .HasForeignKey(wt => wt.TrackerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.OldStatus)
            .WithMany()
            .HasForeignKey(wt => wt.OldStatusId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wt => wt.NewStatus)
            .WithMany()
            .HasForeignKey(wt => wt.NewStatusId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
