using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/categories")]
[Authorize]
public class IssueCategoriesController : ControllerBase
{
    private readonly IIssueCategoryService _categoryService;

    public IssueCategoriesController(IIssueCategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<IssueCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAsync(string identifier)
    {
        var categories = await _categoryService.ListByProjectAsync(identifier);
        return Ok(categories);
    }

    [HttpPost]
    [ProducesResponseType(typeof(IssueCategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateIssueCategoryRequest request)
    {
        var category = await _categoryService.CreateAsync(identifier, request);
        return CreatedAtAction("List", new { identifier }, category);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(IssueCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateIssueCategoryRequest request)
    {
        var category = await _categoryService.UpdateAsync(id, request);

        if (category is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "카테고리를 찾을 수 없습니다."
            });
        }

        return Ok(category);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _categoryService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "카테고리를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
