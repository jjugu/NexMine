using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Groups.Dtos;
using Nexmine.Application.Features.Groups.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/groups")]
[Authorize(Roles = "Admin")]
public class AdminGroupsController : ControllerBase
{
    private readonly IUserGroupService _userGroupService;

    public AdminGroupsController(IUserGroupService userGroupService)
    {
        _userGroupService = userGroupService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<UserGroupDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var groups = await _userGroupService.ListAsync();
        return Ok(groups);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UserGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var group = await _userGroupService.GetByIdAsync(id);

        if (group is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "그룹을 찾을 수 없습니다."
            });
        }

        return Ok(group);
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserGroupDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateUserGroupRequest request)
    {
        var group = await _userGroupService.CreateAsync(request);
        return CreatedAtAction("GetById", "AdminGroups", new { id = group.Id }, group);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(UserGroupDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserGroupRequest request)
    {
        var group = await _userGroupService.UpdateAsync(id, request);

        if (group is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "그룹을 찾을 수 없습니다."
            });
        }

        return Ok(group);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _userGroupService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "그룹을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }

    [HttpPost("{id:int}/members")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddMembersAsync(int id, [FromBody] AddGroupMembersRequest request)
    {
        await _userGroupService.AddMembersAsync(id, request.UserIds);
        var group = await _userGroupService.GetByIdAsync(id);
        return Ok(group);
    }

    [HttpDelete("{id:int}/members/{userId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMemberAsync(int id, int userId)
    {
        await _userGroupService.RemoveMemberAsync(id, userId);
        return NoContent();
    }
}
