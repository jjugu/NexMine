using Nexmine.Application.Features.News.Dtos;

namespace Nexmine.Application.Features.News.Interfaces;

public interface INewsService
{
    Task<List<NewsDto>> ListAsync(string projectIdentifier);
    Task<NewsDto?> GetByIdAsync(int id);
    Task<NewsDto> CreateAsync(string projectIdentifier, CreateNewsRequest request, int userId);
    Task<NewsDto?> UpdateAsync(int id, UpdateNewsRequest request);
    Task<bool> DeleteAsync(int id);
}
