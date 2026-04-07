using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.CustomFields.Dtos;
using Nexmine.Application.Features.CustomFields.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/custom-fields")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly ICustomFieldService _customFieldService;

    public CustomFieldsController(ICustomFieldService customFieldService)
    {
        _customFieldService = customFieldService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<CustomFieldDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAsync(string identifier, [FromQuery] string customizable = "issue")
    {
        var fields = await _customFieldService.GetForProjectAsync(identifier, customizable);
        return Ok(fields);
    }
}
