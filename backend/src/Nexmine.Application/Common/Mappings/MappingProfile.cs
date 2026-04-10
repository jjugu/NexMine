using AutoMapper;
using Nexmine.Application.Features.Auth.Dtos;
using Nexmine.Application.Features.Issues.Dtos;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Domain.Entities;
using Version = Nexmine.Domain.Entities.Version;

namespace Nexmine.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.HasPassword, opt => opt.MapFrom(src => !string.IsNullOrEmpty(src.PasswordHash)));

        CreateMap<Project, ProjectDto>();

        CreateMap<ProjectMembership, ProjectMemberDto>()
            .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.Username))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name));

        CreateMap<Tracker, TrackerDto>();
        CreateMap<IssueStatus, IssueStatusDto>();
        CreateMap<IssuePriority, IssuePriorityDto>();
        CreateMap<IssueCategory, IssueCategoryDto>();
        CreateMap<Version, VersionDto>();
    }
}
