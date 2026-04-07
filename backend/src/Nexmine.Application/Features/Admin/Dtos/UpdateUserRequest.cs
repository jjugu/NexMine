namespace Nexmine.Application.Features.Admin.Dtos;

public class UpdateUserRequest
{
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool? IsAdmin { get; set; }
    public bool? IsActive { get; set; }
}
