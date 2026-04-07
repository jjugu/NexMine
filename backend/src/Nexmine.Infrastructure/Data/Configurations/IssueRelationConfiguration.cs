using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class IssueRelationConfiguration : IEntityTypeConfiguration<IssueRelation>
{
    public void Configure(EntityTypeBuilder<IssueRelation> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasIndex(r => new { r.IssueFromId, r.IssueToId });

        builder.HasOne(r => r.IssueFrom)
            .WithMany(i => i.RelationsFrom)
            .HasForeignKey(r => r.IssueFromId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.IssueTo)
            .WithMany(i => i.RelationsTo)
            .HasForeignKey(r => r.IssueToId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
