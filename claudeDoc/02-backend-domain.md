# Backend Domain Layer 규칙

## 1. 엔티티 설계 원칙
- **순수 POCO** 클래스: EF Core 속성(`[Key]`, `[Required]` 등) 사용 금지
- 모든 EF 설정은 **Fluent API** (`IEntityTypeConfiguration<T>`)에서 처리
- 모든 엔티티는 `BaseEntity` 상속

```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## 2. 엔티티 프로퍼티 규칙
- **PK**: `Id` (int, auto-increment)
- **FK**: `{NavigationProperty}Id` (예: `ProjectId`, `AssignedToId`)
- **Navigation Property**: virtual 사용하지 않음 (Lazy Loading 사용 안 함)
- **문자열 최대 길이**: Fluent API에서 `.HasMaxLength()` 지정
- **Nullable**: C# nullable reference type (`?`) 명시

## 3. Enum 규칙
- `Nexmine.Domain/Enums/` 디렉토리에 위치
- 값을 명시적으로 할당 (DB 호환성)
```csharp
public enum VersionStatus
{
    Open = 0,
    Locked = 1,
    Closed = 2
}
```

## 4. 관계 설정 규칙 (Fluent API)
- **1:N**: `HasMany().WithOne().HasForeignKey().OnDelete(DeleteBehavior.Restrict)`
- 기본 `Cascade` 사용 금지 → 명시적으로 `Restrict` 또는 `SetNull`
- **Self-referencing** (ParentId): `OnDelete(DeleteBehavior.Restrict)`
- **다형성 참조** (Attachment): `AttachableType` + `AttachableId` 패턴

## 5. 인덱스 규칙
- FK 컬럼은 자동 인덱스 (EF Core 기본)
- 자주 쿼리되는 복합 조건에 **복합 인덱스** 추가
- Unique 제약: Fluent API `.HasIndex().IsUnique()`
```csharp
// 예시: Issue 엔티티 설정
builder.HasIndex(e => new { e.ProjectId, e.StatusId });
builder.HasIndex(e => new { e.StatusId, e.Position }); // 칸반용
```

## 6. Seed 데이터 규칙
- `Nexmine.Infrastructure/Data/Seed/SeedData.cs`에서 관리
- **고정 ID 사용** (Seed 데이터 간 FK 참조를 위해)
- 기본 Seed: Roles, Trackers, IssueStatuses, IssuePriorities, Admin 계정
- `Program.cs`에서 `DbContext.Database.EnsureCreated()` 또는 Migration 시 적용

## 7. 엔티티 변경 추적
- `CreatedAt`/`UpdatedAt`는 `DbContext.SaveChangesAsync()` 오버라이드에서 자동 설정
```csharp
public override Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    foreach (var entry in ChangeTracker.Entries<BaseEntity>())
    {
        if (entry.State == EntityState.Added)
            entry.Entity.CreatedAt = DateTime.UtcNow;
        if (entry.State == EntityState.Modified)
            entry.Entity.UpdatedAt = DateTime.UtcNow;
    }
    return base.SaveChangesAsync(ct);
}
```

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
