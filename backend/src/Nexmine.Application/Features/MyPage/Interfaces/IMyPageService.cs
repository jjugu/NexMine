using Nexmine.Application.Features.MyPage.Dtos;

namespace Nexmine.Application.Features.MyPage.Interfaces;

public interface IMyPageService
{
    Task<MyPageDto> GetMyPageAsync(int userId);
    Task SaveLayoutAsync(int userId, SaveWidgetLayoutRequest request);
}
