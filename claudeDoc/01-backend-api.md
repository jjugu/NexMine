# Backend API 설계 규칙

## 1. 엔드포인트 네이밍
- **리소스 중심** RESTful 설계 (동사 금지, 명사 복수형)
- URL은 모두 **kebab-case** (예: `/api/issue-statuses`, `/api/time-entries`)
- 프로젝트 스코프 리소스: `/api/projects/{identifier}/issues`
- 글로벌 단일 리소스: `/api/issues/{id}`
- 중첩은 **최대 2단계**까지 (예: `/api/projects/{id}/issues` OK, `/api/projects/{id}/issues/{id}/journals` 대신 `/api/issues/{id}/journals`)

## 2. HTTP 메서드 매핑
| 메서드 | 용도 | 성공 응답 코드 |
|--------|------|----------------|
| GET | 조회 (단건/목록) | 200 OK |
| POST | 생성 | 201 Created + Location 헤더 |
| PUT | 전체 수정 | 200 OK |
| PATCH | 부분 수정 (필요 시) | 200 OK |
| DELETE | 삭제/비활성화 | 204 No Content |

## 3. 응답 형식
### 단건 응답
```json
{
  "id": 1,
  "subject": "버그 수정",
  "status": "New"
}
```

### 목록 응답 (항상 페이지네이션)
```json
{
  "items": [...],
  "totalCount": 150,
  "page": 1,
  "pageSize": 25
}
```

### 에러 응답 (RFC 7807 ProblemDetails)
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "errors": {
    "Subject": ["Subject is required."],
    "DueDate": ["DueDate must be after StartDate."]
  }
}
```

## 4. 에러 코드 체계
| HTTP 코드 | 사용 시점 |
|-----------|-----------|
| 400 | 유효성 검증 실패 |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 (인증됨, 권한 부족) |
| 404 | 리소스 없음 |
| 409 | 중복/충돌 (예: 동일 identifier 프로젝트) |
| 422 | 비즈니스 규칙 위반 |
| 500 | 서버 내부 오류 (ExceptionMiddleware에서 처리) |

## 5. 페이지네이션 규칙
- 기본 `page=1`, `pageSize=25`
- 최대 `pageSize=100`
- 쿼리 파라미터: `?page=1&pageSize=25&sortBy=createdAt&sortDir=desc`
- `sortBy`는 DTO 프로퍼티명 (camelCase)

## 6. 필터링 규칙
- 쿼리 파라미터로 전달: `?statusId=1&trackerId=2&assignedToId=5`
- 다중 값: `?statusId=1,2,3` (쉼표 구분)
- 날짜 범위: `?startDateFrom=2026-01-01&startDateTo=2026-12-31`
- 텍스트 검색: `?search=keyword`

## 7. Controller 작성 규칙
```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class IssuesController : ControllerBase
{
    // 생성자 DI만 사용 (서비스 주입)
    // 컨트롤러에 비즈니스 로직 금지 → 서비스로 위임
    // 각 액션에 ProducesResponseType 명시 (Swagger 문서화)
}
```

## 8. DTO 규칙
- **Request DTO**: `Create{Entity}Request`, `Update{Entity}Request`
- **Response DTO**: `{Entity}Dto` (목록용), `{Entity}DetailDto` (상세용)
- **Filter DTO**: `{Entity}FilterParams`
- DTO에 도메인 엔티티 직접 노출 금지 → AutoMapper로 변환
- Nullable 프로퍼티에 `?` 명시

## 9. Swagger 문서화
- 모든 Controller에 `[ProducesResponseType]` 속성
- Request/Response DTO에 XML 주석 (필요 시)
- Swagger UI에서 JWT 인증 테스트 가능하도록 `AddSecurityDefinition` 설정

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-07 | CreatedAtAction "No route matches the supplied values" | ASP.NET Core가 메서드명에서 Async를 자동 제거하여 nameof(XxxAsync) 라우트 매칭 실패. 또한 다른 Route 경로의 액션을 참조할 때 컨트롤러명 미지정 | 1) nameof 대신 문자열 직접 지정 "GetById" 2) 다른 경로의 액션은 컨트롤러명 명시 CreatedAtAction("GetById", "Issues", ...) | CreatedAtAction은 항상 문자열 액션명 사용, Async 접미사 제거. 특수 라우트([HttpGet("/api/...")])에서는 컨트롤러명 반드시 명시 |
| 2026-04-07 | WebApplicationFactory 통합테스트에서 seed admin 로그인 401 | EnsureCreatedAsync가 SeedData의 BCrypt 해시를 그대로 삽입하지만, 해시가 현재 BCrypt.Net 버전과 호환되지 않을 수 있음 | InitializeAsync에서 admin 패스워드를 IPasswordHashService.Hash()로 재해시 | 통합테스트 팩토리에서 seed 유저 사용 시 반드시 비밀번호를 런타임에서 재해시하여 호환성 보장 |
| 2026-04-07 | Admin 엔드포인트 응답에서 items 프로퍼티 접근 실패 (KeyNotFoundException) | Admin CRUD 엔드포인트는 List<T> 배열을 직접 반환하나, 테스트에서 { items: [...] } 페이징 응답을 가정 | JsonElement.ValueKind == Array 체크 후 분기 처리 | 테스트 작성 시 API 컨트롤러의 실제 응답 형식(배열 vs 페이징 객체)을 먼저 확인할 것 |
