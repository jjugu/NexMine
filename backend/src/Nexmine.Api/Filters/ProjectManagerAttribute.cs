using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Api.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class ProjectManagerAttribute : ActionFilterAttribute
{
    private const int ManagerRoleId = 1;

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Admin always allowed
        var isAdminClaim = user.FindFirst("isAdmin")?.Value;
        if (isAdminClaim == "true")
        {
            await next();
            return;
        }

        var identifier = context.RouteData.Values["identifier"]?.ToString();
        if (string.IsNullOrEmpty(identifier))
        {
            context.Result = new ForbidResult();
            return;
        }

        var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<NexmineDbContext>();

        var isManager = await db.ProjectMemberships
            .AnyAsync(pm => pm.Project.Identifier == identifier
                && pm.UserId == userId
                && pm.RoleId == ManagerRoleId);

        if (!isManager)
        {
            context.Result = new ObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "접근 거부",
                Detail = "프로젝트 관리자만 이 작업을 수행할 수 있습니다."
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
