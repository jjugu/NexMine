using AutoMapper;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Nexmine.Application.Features.Auth.Dtos;
using Nexmine.Application.Features.Auth.Interfaces;
using Nexmine.Application.Features.Settings.Interfaces;
using Nexmine.Domain.Entities;
using Nexmine.Infrastructure.Data;

namespace Nexmine.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly NexmineDbContext _dbContext;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHashService _passwordHashService;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    private readonly ISystemSettingService _systemSettingService;

    public AuthService(
        NexmineDbContext dbContext,
        IJwtTokenService jwtTokenService,
        IPasswordHashService passwordHashService,
        IMapper mapper,
        IConfiguration configuration,
        ISystemSettingService systemSettingService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _passwordHashService = passwordHashService;
        _mapper = mapper;
        _configuration = configuration;
        _systemSettingService = systemSettingService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress)
    {
        var mode = await _systemSettingService.GetAsync("registration_mode") ?? "open";

        if (mode == "disabled")
        {
            throw new InvalidOperationException("회원가입이 비활성화되어 있습니다.");
        }

        var existingUser = await _dbContext.Users
            .AnyAsync(u => u.Username == request.Username || u.Email == request.Email);

        if (existingUser)
        {
            throw new InvalidOperationException("이미 사용 중인 아이디 또는 이메일입니다.");
        }

        var isApprovalMode = mode == "approval";

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _passwordHashService.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = !isApprovalMode
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        if (isApprovalMode)
        {
            return new AuthResponse
            {
                RequiresApproval = true
            };
        }

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

    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request, string? ipAddress)
    {
        var googleClientId = await _systemSettingService.GetAsync("google_client_id")
            ?? _configuration["Google:ClientId"]
            ?? throw new InvalidOperationException("Google Client ID가 설정되지 않았습니다. 관리자 설정에서 입력해주세요.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId }
            });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("유효하지 않은 Google 인증 토큰입니다.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

        if (user is null)
        {
            var username = await GenerateUniqueUsernameAsync(payload.Email);
            user = new User
            {
                Username = username,
                Email = payload.Email,
                PasswordHash = string.Empty,
                FirstName = payload.GivenName ?? string.Empty,
                LastName = payload.FamilyName ?? string.Empty,
                GoogleId = payload.Subject,
                AvatarUrl = payload.Picture,
                IsActive = true
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = payload.Subject;
                user.AvatarUrl = payload.Picture;
                if (string.IsNullOrEmpty(user.FirstName)) user.FirstName = payload.GivenName;
                if (string.IsNullOrEmpty(user.LastName)) user.LastName = payload.FamilyName;
                await _dbContext.SaveChangesAsync();
            }
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("비활성화된 계정입니다.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user, ipAddress);
    }

    private async Task<string> GenerateUniqueUsernameAsync(string email)
    {
        var username = email.Split('@')[0];
        var baseUsername = username;
        var counter = 1;

        while (await _dbContext.Users.AnyAsync(u => u.Username == username))
        {
            username = $"{baseUsername}{counter}";
            counter++;
        }

        return username;
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
