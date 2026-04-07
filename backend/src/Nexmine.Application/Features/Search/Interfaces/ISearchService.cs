using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Search.Dtos;

namespace Nexmine.Application.Features.Search.Interfaces;

public interface ISearchService
{
    Task<PagedResult<SearchResultItemDto>> SearchAsync(string query, string scope, int userId, int page, int pageSize);
}
