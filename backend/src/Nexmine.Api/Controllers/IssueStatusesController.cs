using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/issue-statuses")]
[Authorize]
public class IssueStatusesController : ControllerBase
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public IssueStatusesController(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<IssueStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var statuses = await _dbContext.IssueStatuses
            .OrderBy(s => s.Position)
            .ToListAsync();

        return Ok(_mapper.Map<List<IssueStatusDto>>(statuses));
    }
}
