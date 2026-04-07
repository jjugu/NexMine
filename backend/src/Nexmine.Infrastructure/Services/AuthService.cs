using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Nexmine.Application.Features.Auth.Dtos;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHashService _passwordHashService;
    private readonly IMapper _mapper;

    public AuthService(
        NexmineDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IPasswordHashService passwordHashService,
        IMapper mapper)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _passwordHashService = passwordHashService;
        _mapper = mapper;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress)
    {
        var existingUser = await _dbContext.Users
            .AnyAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (existingUser)
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
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user is null || !_passwordHashService.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("비활성화된 계정입니다.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, string? ipAddress)
    {
        var storedToken = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken is null)
        {
            throw new UnauthorizedAccessException("유효하지 않은 인증 토큰입니다.");
        }

        if (storedToken.RevokedAt is not null)
        {
            throw new UnauthorizedAccessException("만료된 인증 세션입니다. 다시 로그인해주세요.");
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }

        // Rotate: revoke old token
        storedToken.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(storedToken.User, ipAddress);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken is not null && storedToken.RevokedAt is null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            throw new KeyNotFoundException("사용자를 찾을 수 없습니다.");
        }

        return _mapper.Map<UserDto>(user);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, string? ipAddress)
    {
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshTokenValue = _jwtTokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress,
            UserId = user.Id
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            User = _mapper.Map<UserDto>(user)
        };
    }
}
