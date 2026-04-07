using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexmine.Api.Extensions;
using Nexmine.Application.Features.Documents.Dtos;
using Nexmine.Application.Features.Documents.Interfaces;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/attachments")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentService _attachmentService;

    public AttachmentsController(IAttachmentService attachmentService)
    {
        _attachmentService = attachmentService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AttachmentUploadResult), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UploadAsync(
        IFormFile file,
        [FromForm] string attachableType,
        [FromForm] int attachableId)
    {
        var userId = User.GetUserId();
        var result = await _attachmentService.UploadAsync(file, attachableType, attachableId, userId);
        return CreatedAtAction("GetById", "Attachments", new { id = result.Id }, result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AttachmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByIdAsync(int id)
    {
        var attachment = await _attachmentService.GetByIdAsync(id);

        if (attachment is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "첨부파일을 찾을 수 없습니다."
            });
        }

        return Ok(attachment);
    }

    [HttpGet("{id:int}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAsync(int id)
    {
        var result = await _attachmentService.DownloadAsync(id);

        if (result is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "첨부파일을 찾을 수 없습니다."
            });
        }

        var (stream, contentType, fileName) = result.Value;
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var success = await _attachmentService.DeleteAsync(id);

        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "찾을 수 없음",
                Detail = "첨부파일을 찾을 수 없습니다."
            });
        }

        return NoContent();
    }
}
