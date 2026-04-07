using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.IntegrationTests.Fixtures;

public class NexmineWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"nexmine_test_{Guid.NewGuid()}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<NexmineDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            // Add test SQLite database
            services.AddDbContext<NexmineDbContext>(options =>
                options.UseSqlite($"Data Source={_dbPath}"));
        });
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexmineDbContext>();
        await db.Database.EnsureCreatedAsync();

        // Re-hash admin password to ensure compatibility
        var passwordHashService = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (admin is not null)
        {
            admin.PasswordHash = passwordHashService.Hash("admin");
            await db.SaveChangesAsync();
        }
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await DisposeAsync();
        SqliteConnection.ClearAllPools();
        if (File.Exists(_dbPath))
            File.Delete(_dbPath);
    }
}
