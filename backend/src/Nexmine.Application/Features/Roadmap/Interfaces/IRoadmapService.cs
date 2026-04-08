using Nexmine.Application.Features.Roadmap.Dtos;

namespace Nexmine.Application.Features.Roadmap.Interfaces;

public interface IRoadmapService
{
    Task<List<RoadmapVersionDto>> GetRoadmapAsync(string projectIdentifier);
}
