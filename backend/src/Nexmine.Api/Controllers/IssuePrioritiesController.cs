using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/issue-priorities")]
[Authorize]
public class IssuePrioritiesController : ControllerBase
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public IssuePrioritiesController(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<IssuePriorityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var priorities = await _dbContext.IssuePriorities
            .OrderBy(p => p.Position)
            .ToListAsync();

        return Ok(_mapper.Map<List<IssuePriorityDto>>(priorities));
    }
}
