using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Issues.Interfaces;
using Nexmine.Infrastructure.Data;
using Version = Nexmine.Domain.Entities.Version;

namespace Nexmine.Infrastructure.Services;

public class VersionService : IVersionService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IMapper _mapper;

    public VersionService(NexmineDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<List<VersionDto>> ListByProjectAsync(string projectIdentifier)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var versions = await _dbContext.Versions
            .Where(v => v.ProjectId == project.Id)
            .OrderBy(v => v.Name)
            .ToListAsync();

        return _mapper.Map<List<VersionDto>>(versions);
    }

    public async Task<VersionDto?> GetByIdAsync(int id)
    {
        var version = await _dbContext.Versions.FindAsync(id);
        return version is null ? null : _mapper.Map<VersionDto>(version);
    }

    public async Task<VersionDto> CreateAsync(string projectIdentifier, CreateVersionRequest request)
    {
        var project = await _dbContext.Projects
            .FirstOrDefaultAsync(p => p.Identifier == projectIdentifier)
            ?? throw new KeyNotFoundException($"프로젝트 '{projectIdentifier}'를 찾을 수 없습니다.");

        var version = new Version
        {
            ProjectId = project.Id,
            Name = request.Name,
            Description = request.Description,
            Status = request.Status,
            DueDate = request.DueDate
        };

        _dbContext.Versions.Add(version);
        await _dbContext.SaveChangesAsync();

        return _mapper.Map<VersionDto>(version);
    }

    public async Task<VersionDto?> UpdateAsync(int id, UpdateVersionRequest request)
    {
        var version = await _dbContext.Versions.FindAsync(id);
        if (version is null)
            return null;

        if (request.Name is not null)
            version.Name = request.Name;

        if (request.Description is not null)
            version.Description = request.Description;

        if (request.Status.HasValue)
            version.Status = request.Status.Value;

        if (request.DueDate.HasValue)
            version.DueDate = request.DueDate.Value;

        await _dbContext.SaveChangesAsync();

        return _mapper.Map<VersionDto>(version);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var version = await _dbContext.Versions.FindAsync(id);
        if (version is null)
            return false;

        _dbContext.Versions.Remove(version);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
