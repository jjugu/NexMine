using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class ProjectFavoriteConfiguration : IEntityTypeConfiguration<ProjectFavorite>
{
    public void Configure(EntityTypeBuilder<ProjectFavorite> builder)
    {
        builder.HasKey(pf => new { pf.UserId, pf.ProjectId });

        builder.HasIndex(pf => pf.UserId);

        builder.HasOne(pf => pf.User)
            .WithMany()
            .HasForeignKey(pf => pf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pf => pf.Project)
            .WithMany()
            .HasForeignKey(pf => pf.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
