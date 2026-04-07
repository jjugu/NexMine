using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Api.Filters;
using Nexmine.Application.Features.Documents.Dtos;
using Nexmine.Application.Features.Documents.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/projects/{identifier}/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet]
    [ProjectMember]
    [ProducesResponseType(typeof(List<DocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(string identifier)
    {
        var documents = await _documentService.ListAsync(identifier);
        return Ok(documents);
    }

    [HttpPost]
    [ProjectMember]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAsync(string identifier, [FromBody] CreateDocumentRequest request)
    {
        var userId = User.GetUserId();
        var document = await _documentService.CreateAsync(identifier, request, userId);
        return CreatedAtAction("GetById", "Documents", new { identifier, id = document.Id }, document);
    }

    [HttpGet("{id:int}")]
    [ProjectMember]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetByIdAsync(string identifier, int id)
    {
        var document = await _documentService.GetByIdAsync(id);

        if (document is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "문서를 찾을 수 없습니다."
            });
        }

        return Ok(document);
    }

    [HttpPut("{id:int}")]
    [ProjectMember]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAsync(string identifier, int id, [FromBody] UpdateDocumentRequest request)
    {
        var document = await _documentService.UpdateAsync(id, request);

        if (document is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "문서를 찾을 수 없습니다."
            });
        }

        return Ok(document);
    }

    [HttpDelete("{id:int}")]
    [ProjectMember]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteAsync(string identifier, int id)
    {
        var success = await _documentService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "문서를 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
