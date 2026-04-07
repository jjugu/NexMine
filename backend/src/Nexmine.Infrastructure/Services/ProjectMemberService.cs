using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Application.Features.Projects.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class ProjectMemberService : IProjectMemberService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public ProjectMemberService(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<List<ProjectMemberDto>> ListMembersAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            throw new KeyNotFoundException("프로젝트를 찾을 수 없습니다.");
        }

        var members = await _dbContext.ProjectMemberships
            .Where(pm => pm.ProjectId == project.Id)
            .Include(pm => pm.User)
            .Include(pm => pm.Role)
            .ToListAsync();

        return _mapper.Map<List<ProjectMemberDto>>(members);
    }

    public async Task<ProjectMemberDto> AddMemberAsync(string projectIdentifier, AddProjectMemberRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            throw new KeyNotFoundException("프로젝트를 찾을 수 없습니다.");
        }

        var user = await _dbContext.Users.FindAsync(request.UserId);
        if (user is null)
        {
            throw new KeyNotFoundException("사용자를 찾을 수 없습니다.");
        }

        var role = await _dbContext.Roles.FindAsync(request.RoleId);
        if (role is null)
        {
            throw new KeyNotFoundException("역할을 찾을 수 없습니다.");
        }

        var existingMembership = await _dbContext.ProjectMemberships
            .AnyAsync(pm => pm.ProjectId == project.Id && pm.UserId == request.UserId);

        if (existingMembership)
        {
            throw new InvalidOperationException("이미 프로젝트 멤버로 등록된 사용자입니다.");
        }

        var membership = new ProjectMembership
        {
            ProjectId = project.Id,
            UserId = request.UserId,
            RoleId = request.RoleId
        };

        _dbContext.ProjectMemberships.Add(membership);
        await _dbContext.SaveChangesAsync();

        // Reload with navigation properties for mapping
        var savedMembership = await _dbContext.ProjectMemberships
            .Include(pm => pm.User)
            .Include(pm => pm.Role)
            .FirstAsync(pm => pm.Id == membership.Id);

        return _mapper.Map<ProjectMemberDto>(savedMembership);
    }

    public async Task<bool> RemoveMemberAsync(string projectIdentifier, int membershipId)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier);

        if (project is null)
        {
            return false;
        }

        var membership = await _dbContext.ProjectMemberships
            .FirstOrDefaultAsync(pm => pm.Id == membershipId && pm.ProjectId == project.Id);

        if (membership is null)
        {
            return false;
        }

        _dbContext.ProjectMemberships.Remove(membership);
        await _dbContext.SaveChangesAsync();

        return true;
    }
}
