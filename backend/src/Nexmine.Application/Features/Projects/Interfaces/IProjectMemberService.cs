using Nexmine.Application.Features.Projects.Dtos;

namespace Nexmine.Application.Features.Projects.Interfaces;

public interface IProjectMemberService
{
    Task<List<ProjectMemberDto>> ListMembersAsync(string projectIdentifier);
    Task<ProjectMemberDto> AddMemberAsync(string projectIdentifier, AddProjectMemberRequest request);
    Task<bool> RemoveMemberAsync(string projectIdentifier, int membershipId);
}
