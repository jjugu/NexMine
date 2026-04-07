namespace Nexmine.Application.Features.Auth.Interfaces;

public interface IPasswordHashService
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
