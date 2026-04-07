using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.DependencyInjection;
using Nexmine.Application.Common.Mappings;

namespace Nexmine.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddFluentValidationAutoValidation();

        return services;
    }
}
