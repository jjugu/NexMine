using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrackersController : ControllerBase
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public TrackersController(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<TrackerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync()
    {
        var trackers = await _dbContext.Trackers
            .OrderBy(t => t.Position)
            .ToListAsync();

        return Ok(_mapper.Map<List<TrackerDto>>(trackers));
    }
}
