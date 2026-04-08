using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Application.Features.Permissions;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/roles")]
[Authorize(Roles = "Admin")]
public class AdminRolesController : ControllerBase
{
    private readonly IAdminRoleService _adminRoleService;

    public AdminRolesController(IAdminRoleService adminRoleService)
    {
        _adminRoleService = adminRoleService;
    }

    [HttpGet("/api/admin/permissions")]
    [ProducesResponseType(typeof(PermissionListResponse), StatusCodes.Status200OK)]
    public IActionResult GetPermissions()
    {
        var response = new PermissionListResponse
        {
            Groups = PermissionConstants.AllGrouped,
            Labels = PermissionConstants.GroupLabels
        };
        return Ok(response);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AdminRoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var roles = await _adminRoleService.ListAsync();
        return Ok(roles);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminRoleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateRoleRequest request)
    {
        var role = await _adminRoleService.CreateAsync(request);
        return CreatedAtAction("List", "AdminRoles", null, role);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AdminRoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateRoleRequest request)
    {
        var role = await _adminRoleService.UpdateAsync(id, request);

        if (role is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "역할을 찾을 수 없습니다."
            });
        }

        return Ok(role);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _adminRoleService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "역할을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
