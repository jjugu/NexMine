using AutoMapper;
using Nexmine.Application.Features.Auth.Dtos;
using Nexmine.Application.Features.Projects.Dtos;
using Nexmine.Domain.Entities;

namespace Nexmine.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<Project, ProjectDto>();

        CreateMap<ProjectMembership, ProjectMemberDto>()
            .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.Username))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name));
    }
}
