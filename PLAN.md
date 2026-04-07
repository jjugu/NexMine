# Nexmine - Redmine 스타일 독립 프로젝트 관리 웹앱 구축 계획 V2

## 1. 목표
Redmine의 핵심 워크플로우를 참고하되, 특정 Redmine 인스턴스에 연결하지 않는 **완전 독립형** 프로젝트 관리 웹앱을 구축한다.

- 다중 사용자, 다중 프로젝트, 역할 기반 권한 관리 지원
- 자체 DB, 자체 인증, 자체 UI를 사용
- 핵심 기능은 이슈 관리, 칸반, 간트차트, 캘린더, 위키, 문서, 대시보드
- `claudeDoc/` 규칙 문서와 충돌하지 않는 구조로 구현

## 2. 범위

### 포함 범위
- 인증/인가
- 프로젝트 및 멤버 관리
- 이슈 CRUD, 필터링, 검색, 변경 이력, 시간 기록
- 칸반 보드
- 간트차트
- 캘린더
- 위키 및 문서 관리
- 글로벌/프로젝트 대시보드
- 관리자용 기준정보 관리

### 초기 버전 제외 범위
- Redmine 데이터 import/export
- 이메일 발송, 외부 메신저 연동
- 실시간 협업(WebSocket)
- 모바일 앱
- SSO/OAuth
- 서브프로젝트 (Project.ParentProjectId)

## 3. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | React 19 + TypeScript + Vite 8 | |
| UI | MUI 7 | Layout, Form, Data Display |
| Routing | react-router-dom 7 | `AuthLayout`, `AppLayout`, `ProtectedRoute` |
| Server State | TanStack Query 5 | 서버 데이터 캐싱/동기화 |
| Client State | Zustand 5 | UI 상태만 저장 |
| Forms | react-hook-form + zod | |
| Table | @tanstack/react-table 8 | |
| Kanban DnD | @hello-pangea/dnd 18 | |
| Calendar | @fullcalendar/react 6 | |
| Gantt | frappe-gantt 우선, 한계 시 Custom SVG | |
| Chart | recharts | 대시보드 도넛/바 차트 |
| Wiki Editor | @tiptap/react 3 | WYSIWYG + Markdown 보조 |
| API Codegen | orval 8 | Swagger → TanStack Query 훅 생성 |
| Backend | ASP.NET Core 9 Web API | |
| ORM | EF Core 9 + SQLite | 초기 개발 DB |
| DB 확장 | PostgreSQL / SQL Server | 후속 전환 고려 |
| Auth | JWT + Refresh Token | Refresh rotation 적용 |
| Password Hash | BCrypt | |
| Validation | FluentValidation 11 | |
| Mapping | AutoMapper 13 | |
| API Docs | Swashbuckle | Swagger/OpenAPI |
| Backend Test | xUnit + WebApplicationFactory | 통합 테스트 중심 |
| Frontend Test | Vitest + React Testing Library | 핵심 화면/훅 검증 |

## 4. 아키텍처

### 백엔드 레이어
```text
Domain (의존성 없음) ← Application ← Infrastructure
                                         ↑
                                        Api
```

### 폴더 구조
```text
C:\Claude\Nexmine\
├── backend\
│   ├── Nexmine.sln
│   ├── src\
│   │   ├── Nexmine.Api\
│   │   ├── Nexmine.Application\
│   │   │   └── Features\
│   │   │       ├── Auth\
│   │   │       ├── Projects\
│   │   │       ├── Issues\
│   │   │       ├── Dashboard\
│   │   │       ├── Wiki\
│   │   │       └── ...
│   │   ├── Nexmine.Domain\
│   │   │   ├── Entities\
│   │   │   └── Enums\
│   │   └── Nexmine.Infrastructure\
│   │       ├── Data\
│   │       │   ├── Configurations\
│   │       │   ├── Seed\
│   │       │   └── NexmineDbContext.cs
│   │       ├── Services\
│   │       ├── Auth\
│   │       └── Files\
│   └── tests\
│       ├── Nexmine.Api.IntegrationTests\
│       └── Nexmine.Application.Tests
│
├── frontend\
│   ├── orval.config.ts
│   └── src\
│       ├── api\
│       │   └── generated\
│       ├── components\
│       │   └── layout\
│       ├── features\
│       │   ├── auth\
│       │   ├── projects\
│       │   ├── issues\
│       │   ├── kanban\
│       │   ├── gantt\
│       │   ├── calendar\
│       │   ├── wiki\
│       │   ├── documents\
│       │   └── dashboard\
│       ├── stores\
│       ├── theme\
│       └── App.tsx
│
├── claudeDoc\
├── CLAUDE.md
└── .gitignore
```

### 구조 원칙
- 백엔드 Application 레이어는 `Features/{FeatureName}/Dtos`, `Interfaces`, `Validators` 구조 사용
- 프론트엔드는 `features/{feature-name}/components`, `hooks`, `stores`, `types` 구조 사용
- `src/api/generated/` 는 orval 생성 코드 전용 디렉터리로 사용하며 직접 수정하지 않음

## 5. 핵심 설계 원칙

### 공통
- 코드 식별자와 주석은 영어, UI 텍스트와 프로젝트 문서는 한국어
- YAGNI, DRY, 단일 책임 원칙 준수
- 모든 구현은 `claudeDoc/` 규칙 문서와 충돌하지 않아야 함

### 백엔드
- 엔티티는 순수 POCO로 유지하고 EF 속성 대신 Fluent API 사용
- 모든 엔티티는 `BaseEntity(Id, CreatedAt, UpdatedAt)` 상속
- Lazy Loading 사용하지 않음
- 변경 이력은 서비스 레이어에서 처리
- 목록 API는 항상 페이지네이션 적용
- 에러 응답은 RFC 7807 `ProblemDetails` 형식 사용

### 프론트엔드
- 서버 데이터는 TanStack Query, UI 상태만 Zustand 사용
- 필터, 정렬, 페이지네이션, 탭 상태는 URL search params 로 관리
- 인증 페이지와 앱 페이지는 `AuthLayout` / `AppLayout` 으로 분리
- 모든 feature page 는 `React.lazy()` + `Suspense` 적용

## 6. 핵심 데이터 모델

| Entity | 주요 필드 | 비고 |
|--------|-----------|------|
| `User` | `Username`, `Email`, `PasswordHash`, `IsAdmin` | |
| `RefreshToken` | `UserId`, `Token`, `ExpiresAt`, `RevokedAt` | Refresh rotation |
| `Role` | `Name`, `PermissionsJson` | 프로젝트 멤버십 권한 |
| `Project` | `Name`, `Identifier`, `Description`, `IsPublic`, `IsArchived` | `Identifier` 유니크, 삭제 대신 아카이브 |
| `ProjectMembership` | `ProjectId`, `UserId`, `RoleId` | 복합 유니크 |
| `Tracker` | `Name`, `Position` | Bug, Feature, Task 등 |
| `IssueStatus` | `Name`, `IsClosed`, `Position` | 칸반 컬럼 |
| `IssuePriority` | `Name`, `IsDefault`, `Position` | |
| `IssueCategory` | `ProjectId`, `Name`, `Position` | 프로젝트별 |
| `Version` | `ProjectId`, `Name`, `Status`, `DueDate` | 마일스톤 |
| `Issue` | `ProjectId`, `TrackerId`, `StatusId`, `PriorityId`, `CategoryId`, `VersionId`, `AssigneeId`, `AuthorId`, `ParentIssueId`, `Subject`, `Description`, `StartDate`, `DueDate`, `DoneRatio`, `EstimatedHours`, `Position`, `IsPrivate` | 핵심 엔티티 |
| `IssueRelation` | `IssueFromId`, `IssueToId`, `RelationType`, `Delay` | Gantt 의존성용, Delay는 Precedes/Follows 지연일(일) |
| `Journal` | `IssueId`, `UserId`, `Notes` | 변경 이력 헤더 |
| `JournalDetail` | `JournalId`, `PropertyName`, `OldValue`, `NewValue` | 변경 항목 상세 |
| `TimeEntry` | `IssueId`, `UserId`, `Hours`, `SpentOn`, `ActivityType`, `Comments` | |
| `WikiPage` | `ProjectId`, `ParentPageId`, `Title`, `Slug`, `ContentHtml`, `Version` | 트리 구조 |
| `WikiPageVersion` | `WikiPageId`, `Version`, `Title`, `ContentHtml`, `EditedByUserId` | 위키 버전 스냅샷 |
| `Attachment` | `FileName`, `StoredPath`, `ContentType`, `Size`, `AttachableType`, `AttachableId` | 다형성 참조 |
| `Document` | `ProjectId`, `Title`, `Description`, `CategoryName` | 문서 엔티티 |

### 도메인 규칙
- 프로젝트 삭제는 하드 삭제 대신 `IsArchived = true` 소프트 삭제 사용
- `IssueStatus.IsClosed = true` 로 변경 시 `Issue.DoneRatio = 100` 자동 보정
- `Issue.Position` 은 칸반 정렬용으로 사용
- `WikiPage.Slug` 는 영문 kebab-case, 한글 제목은 `encodeURI` 방식 허용
- 첨부파일 경로는 DB에 상대 경로로 저장
- 기본 Seed 데이터는 `Roles`, `Trackers`, `IssueStatuses`, `IssuePriorities`, `Admin 계정`

## 7. 인증/인가 모델

### 인증 플로우
```text
회원가입 → 로그인 → Access Token + Refresh Token 발급
만료 시 refresh → Access Token 재발급 + Refresh Token rotation
로그아웃 → Refresh Token 폐기
```

### 인가 레벨
| 레벨 | 적용 범위 | 구현 방식 |
|------|-----------|-----------|
| Public | 로그인, 회원가입 | `[AllowAnonymous]` |
| Authenticated | 대부분의 API | `[Authorize]` |
| Project Member | 프로젝트 내부 조회/수정 | 커스텀 `[ProjectMember]` |
| Project Manager | 프로젝트 설정, 멤버 관리 | 커스텀 `[ProjectManager]` |
| Admin | 사용자/역할/기준정보 관리 | `[Authorize(Roles = "Admin")]` |

### 보안 규칙
- 비밀번호 최소 길이 8자
- 개발 CORS 는 `http://localhost:5173` 만 허용
- 프로덕션은 HTTPS 필수
- 위키/문서 렌더링 시 HTML sanitize 적용
- Raw SQL 직접 사용 지양, EF Core 파라미터 바인딩 우선

## 8. API 설계 원칙

### 공통 규칙
- URL 은 모두 `kebab-case`
- 리소스 중심 RESTful 설계
- 중첩은 최대 2단계까지만 허용
- 단건 응답은 직접 리소스 반환
- 목록 응답은 `{ items, totalCount, page, pageSize }`
- 에러 응답은 `ProblemDetails`
- 기본 페이지네이션은 `page=1`, `pageSize=25`, 최대 `pageSize=100`

### 주요 엔드포인트
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me

GET|POST         /api/projects
GET|PUT|DELETE   /api/projects/{identifier}
GET|POST|DELETE  /api/projects/{identifier}/members

GET  /api/dashboard
GET  /api/projects/{identifier}/dashboard

GET|POST         /api/projects/{identifier}/issues
GET|PUT|DELETE   /api/issues/{id}
POST             /api/issues/{id}/journals
PUT              /api/issues/{id}/position

GET  /api/trackers
GET  /api/issue-statuses
GET  /api/issue-priorities

GET|POST|PUT|DELETE  /api/projects/{identifier}/versions
GET|POST|PUT|DELETE  /api/time-entries

GET  /api/projects/{identifier}/gantt
GET  /api/projects/{identifier}/calendar?start=2026-04-01&end=2026-04-30

GET|POST|PUT|DELETE  /api/projects/{identifier}/wiki/{slug}
GET  /api/projects/{identifier}/wiki/{slug}/versions
GET  /api/projects/{identifier}/wiki/{slug}/versions/{version}

GET|POST|PUT|DELETE  /api/projects/{identifier}/categories
GET|POST|PUT|DELETE  /api/projects/{identifier}/documents

POST|DELETE  /api/issues/{id}/relations
GET          /api/issues/{id}/time-entries

POST   /api/attachments
GET    /api/attachments/{id}/download
DELETE /api/attachments/{id}

GET  /api/search?q=&scope=issues|wiki|all

GET|POST|PUT|DELETE  /api/admin/users
GET|POST|PUT|DELETE  /api/admin/roles
GET|POST|PUT|DELETE  /api/admin/trackers
GET|POST|PUT|DELETE  /api/admin/issue-statuses
GET|POST|PUT|DELETE  /api/admin/issue-priorities
```

### API 계약 준수 항목
- 모든 Controller 는 Swagger 문서화와 `ProducesResponseType` 명시
- Swagger 갱신 후 orval 로 프론트 API 코드 재생성
- 생성 코드 변경 금지, 커스텀 로직은 래핑 훅에서 처리

## 9. 프론트엔드 라우팅

```text
/login
/register
/dashboard
/projects
/projects/:identifier
/projects/:identifier/issues
/projects/:identifier/issues/:id
/projects/:identifier/board
/projects/:identifier/gantt
/projects/:identifier/calendar
/projects/:identifier/wiki
/projects/:identifier/wiki/:slug
/projects/:identifier/documents
/projects/:identifier/settings
/admin/users
/admin/roles
/admin/trackers
/admin/statuses
/admin/priorities
```

### 라우팅 원칙
- 상위 레벨에서 `AuthLayout` / `ProtectedRoute + AppLayout` 분리
- 프로젝트 하위 라우트는 `identifier` 기반 nested route 로 구성
- 페이지 필터와 정렬은 search params 로 유지
- 관리자 라우트는 일반 사용자 라우트와 분리

## 10. 운영/품질 기준

### 데이터베이스와 마이그레이션
- 개발 환경에서는 `Database.Migrate()` 자동 적용
- 프로덕션은 수동 마이그레이션 적용
- 마이그레이션 생성 전 `dotnet build` 확인
- SQLite 기준으로 설계하되, provider 종속 SQL 사용을 최소화

### 파일 저장소
- `IFileStorageService` 로 추상화
- 개발 환경 저장 경로: `backend/uploads/{yyyy}/{MM}/{guid}_{filename}`
- DB 에는 상대 경로만 저장
- `uploads/` 는 Git 추적 제외

### 감사 추적과 변경 이력
- 이슈 수정 시 `Journal` + `JournalDetail` 자동 생성
- 위키 저장 시 `WikiPageVersion` 자동 생성
- 중요 변경은 사용자 ID 와 시간 포함

### 성능/UX 기준
- 대시보드는 60초 간격 자동 새로고침 허용
- 칸반은 낙관적 업데이트 적용
- 간트는 대량 이슈 시 가상화 또는 최소 렌더링 전략 고려
- 캘린더는 현재 표시 범위만 조회

## 11. 구현 단계

### Phase 0: Bootstrap & Conventions
목표: 저장소 스캐폴딩과 공통 규칙을 먼저 고정한다.

백엔드
1. `Nexmine.sln` 생성 및 4개 프로젝트 구성
2. 참조 관계 설정
3. `BaseEntity`, 공통 예외, 공통 응답 규칙 뼈대 구성
4. `NexmineDbContext` 골격과 Fluent API 설정 디렉터리 준비

프론트엔드
5. Vite + React + TS 초기화
6. React Router, MUI, TanStack Query, Zustand, RHF, zod, orval 기본 설치
7. `AuthLayout`, `AppLayout`, `ProtectedRoute`, 기본 테마 골격 생성
8. `src/api/generated/` 기준의 API 레이어 구조 마련

완료 기준
- `dotnet build` 통과
- `npm run build` 통과
- 폴더 구조가 `claudeDoc` 규칙과 일치

### Phase 1: Auth + Project Foundation
목표: 로그인 가능한 상태와 프로젝트/멤버십 기반 권한 모델을 완성한다.

백엔드
1. `User`, `RefreshToken`, `Role`, `Project`, `ProjectMembership` 엔티티 구현
2. Seed 데이터 구현: Admin, 기본 Role
3. JWT 발급, refresh rotation, logout revoke 구현
4. `ProjectMember`, `ProjectManager` 권한 체크 구현
5. `AuthController`, `ProjectsController`, `ProjectMembersController` 구현
6. 전역 예외 처리와 `ProblemDetails` 응답 통합

프론트엔드
7. 로그인/회원가입 페이지 구현
8. Auth store, Axios 인터셉터, refresh 재시도 처리
9. 인증 가드와 사용자 세션 복원 구현
10. 프로젝트 목록/생성/기본 상세 페이지 구현

완료 기준
- 회원가입 → 로그인 → `me` → refresh → logout 플로우 동작
- 프로젝트 생성/조회/멤버 추가가 권한에 맞게 동작
- Swagger 문서 생성 가능
- orval 코드 생성 후 프론트 타입 에러 없음

### Phase 2: Issue Core
목표: 이슈 관리의 핵심 CRUD 와 변경 이력을 완성한다.

백엔드
1. `Tracker`, `IssueStatus`, `IssuePriority`, `IssueCategory`, `Version`, `Issue`, `Journal`, `JournalDetail`, `TimeEntry` 구현
2. 이슈 CRUD, 필터링, 검색, 정렬, 페이지네이션 구현
3. 상태 변경 시 `DoneRatio` 보정
4. 이슈 수정 시 `Journal` 자동 생성
5. 시간 기록 및 버전 관리 API 구현

프론트엔드
6. 이슈 목록 페이지 구현
7. 필터/정렬/페이지네이션을 URL 상태와 동기화
8. 이슈 상세 페이지, 댓글/변경 이력 타임라인 구현
9. 이슈 생성/수정 폼, 시간 기록 UI 구현
10. 버전 관리 화면 구현

완료 기준
- 프로젝트별 이슈 CRUD 가능
- 필터/검색/페이지네이션이 URL 과 동기화
- 이슈 수정 시 Journal 이 남음
- 기준정보(트래커/상태/우선순위)를 참조해 화면 렌더링 가능

### Phase 3: Dashboard + Kanban
목표: 프로젝트 운영 화면과 칸반 흐름을 제공한다.

백엔드
1. 글로벌 대시보드 집계 API 구현
2. 프로젝트 대시보드 집계 API 구현
3. 칸반용 `Issue.Position` 이동 API 구현
4. Position 재정렬 전략 구현

프론트엔드
5. 글로벌/프로젝트 대시보드 위젯 구현
6. 칸반 보드 구현
7. 같은 컬럼/다른 컬럼 이동 처리
8. 낙관적 업데이트와 실패 시 롤백 구현

완료 기준
- 내 이슈, 최근 활동, 상태별 통계, 기한 초과 목록 표시
- 칸반 드래그 앤 드롭이 상태/순서 변경을 정확히 반영
- `IsClosed=true` 상태 컬럼은 우측 축소 표시

### Phase 4: Gantt + Calendar
목표: 일정 기반 시각화를 제공한다.

백엔드
1. `IssueRelation` 엔티티 및 관계 API 구현
2. 간트 전용 조회 모델 구현
3. 날짜 범위 기반 캘린더 API 구현

프론트엔드
4. 간트차트 구현: Day/Week/Month 뷰
5. 드래그 이동, 시작일/종료일 리사이즈 구현
6. 관계 화살표 렌더링 구현
7. 캘린더 구현: Month/Week/Day 뷰
8. 이벤트 드래그/리사이즈로 일정 변경 구현

완료 기준
- 시작일/종료일 있는 이슈만 간트/캘린더에 표시
- 간트 이동/리사이즈가 이슈 일정 수정으로 반영
- 캘린더는 현재 화면 범위만 조회

### Phase 5: Wiki + Documents
목표: 프로젝트 문서화 기능을 제공한다.

백엔드
1. `WikiPage`, `WikiPageVersion`, `Attachment`, `Document` 구현
2. 위키 페이지 트리 구조 API 구현
3. 위키 버전 히스토리 API 구현
4. 파일 업로드/다운로드 구현
5. 문서 CRUD API 구현

프론트엔드
6. Tiptap 기반 위키 에디터 구현
7. WYSIWYG 기본 + Markdown 보조 편집 모드 구현
8. 페이지 트리, 버전 히스토리, 버전 비교 UI 구현
9. 문서 목록/상세/업로드 UI 구현

완료 기준
- 위키 페이지 생성/수정/버전 조회 가능
- 저장 시마다 버전 증가 및 스냅샷 생성
- 첨부파일 업로드/다운로드 동작
- 내부 위키 링크와 페이지 트리 동작

### Phase 6: Admin + Search + Polish
목표: 운영 편의성과 마무리 품질을 확보한다.

백엔드
1. 관리자 기준정보 CRUD 완성
2. 글로벌 검색 API 구현
3. 검색 범위: issues, wiki, all

프론트엔드
4. 관리자 화면 구현
5. 글로벌 검색 UI 구현
6. 반응형, 다크모드, 키보드 단축키 정리
7. 공통 로딩/에러/Skeleton 품질 개선

완료 기준
- 관리자 기준정보 관리 가능
- 글로벌 검색 결과가 이슈/위키로 연결
- 주요 화면이 모바일 폭에서도 사용 가능

## 12. Phase 공통 완료 조건
각 Phase 는 아래 조건을 모두 만족해야 완료로 간주한다.

1. 백엔드 빌드 통과
2. 프론트엔드 빌드 통과
3. Swagger 문서 갱신
4. orval 코드 재생성 후 타입 에러 없음
5. 핵심 플로우 수동 검증 완료
6. 새로 발생한 오류는 해당 `claudeDoc/*.md` 오류 기록에 반영

## 13. 검증 전략

### 백엔드
- 인증 통합 테스트: register, login, refresh, logout, me
- 권한 테스트: member / manager / admin 접근 차이
- 이슈 테스트: CRUD, 필터링, Journal 생성, `IsClosed → DoneRatio=100`
- 위키 테스트: 저장 시 버전 생성
- 첨부파일 테스트: 업로드/다운로드와 상대 경로 저장

### 프론트엔드
- `ProtectedRoute` 리다이렉트 테스트
- Auth refresh 인터셉터 테스트
- 이슈 목록 search params 동기화 테스트
- 칸반 낙관적 업데이트 롤백 테스트
- 위키 저장/버전 히스토리 화면 스모크 테스트

### 수동 시나리오
1. 회원가입 → 로그인 → 프로젝트 생성
2. 프로젝트 멤버 추가 → 권한별 접근 확인
3. 이슈 생성 → 수정 → Journal 확인
4. 칸반 드래그 → 간트/캘린더 일정 반영 확인
5. 위키 작성 → 버전 생성 → 문서 업로드 확인

## 14. 개발 워크플로우

```bash
# backend
cd backend && dotnet build
cd backend && dotnet run --project src/Nexmine.Api
cd backend && dotnet ef migrations add [Name] --project src/Nexmine.Infrastructure --startup-project src/Nexmine.Api
cd backend && dotnet test

# frontend
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npx orval
cd frontend && npm run test
```

## 15. 주요 리스크와 대응

| 리스크 | 설명 | 대응 |
|--------|------|------|
| 권한 모델 누락 | 인증만 있고 프로젝트 권한이 빠질 수 있음 | Phase 1 에 `ProjectMember`, `ProjectManager` 구현 강제 |
| API 계약 드리프트 | Swagger, Controller, 프론트 훅이 어긋날 수 있음 | Phase 완료 조건에 `Swagger → orval → TS build` 포함 |
| 칸반 정렬 붕괴 | Position 간격이 좁아지면 순서 꼬임 | 10000 단위 간격 + 재정렬 전략 적용 |
| 간트 라이브러리 한계 | 커스터마이징 부족 가능 | frappe-gantt 우선, 필요 시 Custom SVG 전환 |
| 위키 보안 이슈 | HTML 저장 시 XSS 가능 | sanitize 적용, 허용 태그 제한 |
| DB 전환 비용 | SQLite 에 종속된 구현이 생길 수 있음 | provider 종속 SQL 최소화, EF 중심 구현 유지 |

## 16. Phase 1 우선 핵심 파일
- `backend/src/Nexmine.Api/Program.cs`
- `backend/src/Nexmine.Infrastructure/Data/NexmineDbContext.cs`
- `backend/src/Nexmine.Infrastructure/Data/Seed/SeedData.cs`
- `backend/src/Nexmine.Application/Features/Auth/`
- `backend/src/Nexmine.Application/Features/Projects/`
- `frontend/src/App.tsx`
- `frontend/src/stores/`
- `frontend/src/api/generated/`
- `frontend/orval.config.ts`
