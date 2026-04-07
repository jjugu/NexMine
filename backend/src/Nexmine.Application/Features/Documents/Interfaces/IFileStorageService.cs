namespace Nexmine.Application.Features.Documents.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream stream, string fileName);
    Task<Stream> GetStreamAsync(string storedPath);
    Task DeleteAsync(string storedPath);
}
