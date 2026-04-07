using Nexmine.Application.Features.Documents.Interfaces;

namespace Nexmine.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public FileStorageService(string basePath)
    {
        _basePath = basePath;
    }

    public async Task<string> SaveAsync(Stream stream, string fileName)
    {
        var now = DateTime.UtcNow;
        var relativePath = Path.Combine(
            now.ToString("yyyy"),
            now.ToString("MM"),
            $"{Guid.NewGuid()}_{fileName}");

        var fullPath = Path.Combine(_basePath, relativePath);
        var directory = Path.GetDirectoryName(fullPath)!;

        if (!Directory.Exists(directory))
            Directory.CreateDirectory(directory);

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream);

        return relativePath;
    }

    public Task<Stream> GetStreamAsync(string storedPath)
    {
        var fullPath = Path.Combine(_basePath, storedPath);

        if (!File.Exists(fullPath))
            throw new KeyNotFoundException("파일을 찾을 수 없습니다.");

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storedPath)
    {
        var fullPath = Path.Combine(_basePath, storedPath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
