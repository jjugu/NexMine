using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Common.Models;
using Nexmine.Application.Features.Admin.Dtos;
using Nexmine.Application.Features.Admin.Interfaces;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IPasswordHashService _passwordHashService;

    public AdminUserService(NexmineDbContext dbContext, IPasswordHashService passwordHashService)
    {
        _dbContext = dbContext;
        _passwordHashService = passwordHashService;
    }

    public async Task<PagedResult<AdminUserDto>> ListAsync(string? search, int page, int pageSize)
    {
        var query = _dbContext.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                IsAdmin = u.IsAdmin,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<AdminUserDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminUserDto?> GetByIdAsync(int id)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user is null) return null;

        return new AdminUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<AdminUserDto> CreateAsync(CreateUserRequest request)
    {
        var exists = await _dbContext.Users
            .AnyAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (exists)
        {
            throw new InvalidOperationException("이미 사용 중인 아이디 또는 이메일입니다.");
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _passwordHashService.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsAdmin = request.IsAdmin,
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return new AdminUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<AdminUserDto?> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user is null) return null;

        if (request.Email is not null) user.Email = request.Email;
        if (request.FirstName is not null) user.FirstName = request.FirstName;
        if (request.LastName is not null) user.LastName = request.LastName;
        if (request.IsAdmin.HasValue) user.IsAdmin = request.IsAdmin.Value;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        await _dbContext.SaveChangesAsync();

        return new AdminUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsAdmin = user.IsAdmin,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user is null) return false;

        user.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
