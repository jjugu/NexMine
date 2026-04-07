using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly NexmineDbContext _dbContext;

    public UsersController(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 사용자 검색 (멤버 추가 등에 사용)
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<UserSearchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchAsync([FromQuery] string? q)
    {
        var query = _dbContext.Users
            .Where(u => u.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(term)));
        }

        var users = await query
            .OrderBy(u => u.Username)
            .Take(20)
            .Select(u => new UserSearchDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                DisplayName = (u.LastName ?? "") + (u.FirstName ?? "") != ""
                    ? ((u.LastName ?? "") + " " + (u.FirstName ?? "")).Trim()
                    : u.Username,
            })
            .ToListAsync();

        return Ok(users);
    }
}

public class UserSearchDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
