# Backend 인증/인가 규칙

## 1. 인증 플로우
```
[회원가입] POST /api/auth/register → JWT + Refresh Token 반환
[로그인]   POST /api/auth/login    → JWT + Refresh Token 반환
[갱신]     POST /api/auth/refresh  → 새 JWT + 새 Refresh Token (Rotation)
[로그아웃] POST /api/auth/logout   → Refresh Token 폐기
[내 정보]  GET  /api/auth/me       → 현재 사용자 정보
```

## 2. JWT 구조
```json
{
  "sub": "1",              // userId (string)
  "username": "admin",
  "email": "admin@test.com",
  "isAdmin": "true",
  "iat": 1712500000,
  "exp": 1712500900        // +15분
}
```

## 3. 인가 레벨
| 레벨 | 적용 | 구현 |
|------|------|------|
| **Public** | 로그인/회원가입 | `[AllowAnonymous]` |
| **Authenticated** | 대부분의 API | `[Authorize]` |
| **Project Member** | 프로젝트 내 리소스 | 커스텀 `[ProjectMember]` 필터 |
| **Project Manager** | 프로젝트 설정/멤버 관리 | 커스텀 `[ProjectManager]` 필터 |
| **Admin** | 사용자/역할/시스템 관리 | `[Authorize(Roles = "Admin")]` |

## 4. 프로젝트 권한 확인 패턴
```csharp
// ActionFilter로 구현
public class ProjectMemberAttribute : ActionFilterAttribute
{
    // URL에서 {identifier} 추출 → ProjectMembership 테이블 확인
    // 권한 없으면 403 반환
}
```

## 5. 보안 규칙
- 비밀번호 최소 길이: **8자**
- 로그인 실패 제한: 추후 구현 (Phase 6)
- CORS: 개발 시 `http://localhost:5173`만 허용
- HTTPS: 프로덕션 필수, 개발에서는 선택
- SQL Injection: EF Core 파라미터 바인딩 사용 (Raw SQL 금지)
- XSS: React 기본 이스케이핑 활용, Markdown 렌더링 시 sanitize

## 6. 현재 사용자 접근 패턴
```csharp
// Controller에서 현재 사용자 ID 추출
var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

// 또는 확장 메서드 사용
public static int GetUserId(this ClaimsPrincipal user)
    => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
