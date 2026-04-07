using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AdminRoleService : IAdminRoleService
{
    private readonly NexmineDbContext _dbContext;

    public AdminRoleService(NexmineDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AdminRoleDto>> ListAsync()
    {
        return await _dbContext.Roles
            .OrderBy(r => r.Id)
            .Select(r => new AdminRoleDto
            {
                Id = r.Id,
                Name = r.Name,
                PermissionsJson = r.PermissionsJson
            })
            .ToListAsync();
    }

    public async Task<AdminRoleDto> CreateAsync(CreateRoleRequest request)
    {
        var role = new Role
        {
            Name = request.Name,
            PermissionsJson = request.PermissionsJson
        };

        _dbContext.Roles.Add(role);
        await _dbContext.SaveChangesAsync();

        return new AdminRoleDto
        {
            Id = role.Id,
            Name = role.Name,
            PermissionsJson = role.PermissionsJson
        };
    }

    public async Task<AdminRoleDto?> UpdateAsync(int id, UpdateRoleRequest request)
    {
        var role = await _dbContext.Roles.FindAsync(id);
        if (role is null) return null;

        if (request.Name is not null) role.Name = request.Name;
        if (request.PermissionsJson is not null) role.PermissionsJson = request.PermissionsJson;

        await _dbContext.SaveChangesAsync();

        return new AdminRoleDto
        {
            Id = role.Id,
            Name = role.Name,
            PermissionsJson = role.PermissionsJson
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var role = await _dbContext.Roles.FindAsync(id);
        if (role is null) return false;

        var hasMemberships = await _dbContext.ProjectMemberships.AnyAsync(m => m.RoleId == id);
        if (hasMemberships)
        {
            throw new InvalidOperationException("이 역할을 사용하는 프로젝트 멤버가 있어 삭제할 수 없습니다.");
        }

        _dbContext.Roles.Remove(role);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
