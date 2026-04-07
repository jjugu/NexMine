# Backend Infrastructure Layer 규칙

## 1. DbContext 규칙
- **단일 DbContext** (`NexmineDbContext`) 사용
- 모든 DbSet은 DbContext에 선언
- Entity Configuration은 **별도 파일** (`Data/Configurations/{Entity}Configuration.cs`)
- Connection String은 `appsettings.json` → `IConfiguration`으로 주입

## 2. Repository 패턴
- `IRepository<T>` 제네릭 인터페이스 (Application 레이어에 위치)
- 구현체는 Infrastructure 레이어
```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<T>> ListAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Delete(T entity);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
```
- 복잡한 쿼리가 필요한 엔티티는 전용 Repository 인터페이스 추가 (예: `IIssueRepository`)

## 3. 서비스 구현 규칙
- 인터페이스: `Nexmine.Application/Features/{Feature}/Interfaces/`
- 구현체: `Nexmine.Infrastructure/Services/`
- 서비스 간 직접 의존 금지 → 인터페이스를 통해서만 참조
- 트랜잭션이 필요한 경우 `IDbContextTransaction` 사용

## 4. DI 등록 규칙
- Infrastructure 레이어에 `DependencyInjection.cs` 확장 메서드 작성
```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<NexmineDbContext>(...);
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IAuthService, AuthService>();
        // ...
        return services;
    }
}
```
- Application 레이어에도 동일한 패턴 적용

## 5. EF Core Migration 규칙
- Migration 이름: `{날짜}_{설명}` 형태 (예: `AddIssueEntities`)
- Migration 전 반드시 `dotnet build` 확인
- Migration 파일 수동 수정 금지 (필요 시 새 Migration 추가)
- 개발 중에는 `Database.Migrate()` 자동 적용, 프로덕션에서는 수동 적용

## 6. 파일 저장소 규칙
- `IFileStorageService` 인터페이스로 추상화
- 개발: 로컬 파일시스템 (`backend/uploads/{yyyy}/{MM}/{guid}_{filename}`)
- 저장 경로는 **상대 경로**로 DB에 저장
- `uploads/` 디렉토리는 `.gitignore`에 추가

## 7. 비밀번호 해싱
- BCrypt 사용 (work factor: 12)
- 평문 비밀번호를 로그에 절대 출력하지 않음
- `IPasswordHashService`로 추상화

## 8. JWT 토큰 규칙
- Access Token 만료: **15분**
- Refresh Token 만료: **7일**
- Refresh Token은 DB에 저장 + HttpOnly 쿠키로 전달
- Token Rotation: 갱신 시 기존 Refresh Token 폐기 + 새 토큰 발급
- JWT Secret은 `appsettings.json`에 저장 (프로덕션에서는 환경변수/Secret Manager)

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
