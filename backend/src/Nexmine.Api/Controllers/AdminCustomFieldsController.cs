using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.CustomFields.Dtos;
using Nexmine.Application.Features.CustomFields.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/admin/custom-fields")]
[Authorize(Roles = "Admin")]
public class AdminCustomFieldsController : ControllerBase
{
    private readonly ICustomFieldService _customFieldService;

    public AdminCustomFieldsController(ICustomFieldService customFieldService)
    {
        _customFieldService = customFieldService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CustomFieldDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync([FromQuery] string? customizable = null)
    {
        var fields = await _customFieldService.ListAsync(customizable);
        return Ok(fields);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CustomFieldDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var field = await _customFieldService.GetByIdAsync(id);

        if (field is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "커스텀 필드를 찾을 수 없습니다."
            });
        }

        return Ok(field);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CustomFieldDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateCustomFieldRequest request)
    {
        var field = await _customFieldService.CreateAsync(request);
        return CreatedAtAction("GetById", new { id = field.Id }, field);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(CustomFieldDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateCustomFieldRequest request)
    {
        var field = await _customFieldService.UpdateAsync(id, request);

        if (field is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "커스텀 필드를 찾을 수 없습니다."
            });
        }

        return Ok(field);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _customFieldService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "커스텀 필드를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
