using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.MyPage.Dtos;
using Nexmine.Application.Features.MyPage.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Authorize]
public class MyPageController : ControllerBase
{
    private readonly IMyPageService _myPageService;

    public MyPageController(IMyPageService myPageService)
    {
        _myPageService = myPageService;
    }

    [HttpGet("api/my/page")]
    [ProducesResponseType(typeof(MyPageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPageAsync()
    {
        var userId = User.GetUserId();
        var result = await _myPageService.GetMyPageAsync(userId);
        return Ok(result);
    }

    [HttpPut("api/my/page")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveLayoutAsync([FromBody] SaveWidgetLayoutRequest request)
    {
        var userId = User.GetUserId();
        await _myPageService.SaveLayoutAsync(userId, request);
        return Ok();
    }
}
