using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexmine.Domain.Entities;

namespace Nexmine.Infrastructure.Data.Configurations;

public class JournalDetailConfiguration : IEntityTypeConfiguration<JournalDetail>
{
    public void Configure(EntityTypeBuilder<JournalDetail> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.PropertyName)
            .IsRequired()
            .HasMaxLength(100);
    }
}
