using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class CustomFieldProjectConfiguration : IEntityTypeConfiguration<CustomFieldProject>
{
    public void Configure(EntityTypeBuilder<CustomFieldProject> builder)
    {
        builder.HasKey(cfp => new { cfp.CustomFieldId, cfp.ProjectId });

        builder.HasOne(cfp => cfp.CustomField)
            .WithMany(cf => cf.Projects)
            .HasForeignKey(cfp => cfp.CustomFieldId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cfp => cfp.Project)
            .WithMany()
            .HasForeignKey(cfp => cfp.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
