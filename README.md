# Nexmine

Redmine 스타일의 독립형 프로젝트 관리 웹 애플리케이션.  
자체 DB, 자체 인증, 자체 UI를 갖춘 올인원 프로젝트 관리 도구입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | ASP.NET Core 9, EF Core 9, SQLite |
| Frontend | React 19, TypeScript, Vite, MUI 7 |
| 상태관리 | TanStack Query (서버), Zustand (클라이언트) |
| 인증 | JWT + Refresh Token rotation |
| API 코드젠 | Swagger + Orval |
| 테스트 | xUnit (백엔드), Vitest + Testing Library (프론트) |

## 주요 기능

### 프로젝트 관리
- 다중 프로젝트, 멤버십, 역할 기반 권한
- 프로젝트별 대시보드, 설정, 멤버 관리

### 이슈 트래킹
- CRUD, 필터링, 검색, 변경 이력(Journal), 시간 기록
- 이슈 관계 (blocks, precedes, duplicates 등)
- 커스텀 필드 (텍스트, 정수, 실수, 날짜, 불린, 목록, 링크 — 프로젝트/트래커별 설정)

### 워크플로우
- 역할+트래커별 상태 전이 규칙 매트릭스
- 관리자가 허용할 상태 전환을 체크박스로 설정
- 규칙 미정의 시 모든 전이 허용 (기본 동작)

### 시각화
- **칸반 보드** - 드래그 앤 드롭, 낙관적 업데이트
- **간트차트** - Day/Week/Month 뷰, 드래그 이동/리사이즈
- **캘린더** - FullCalendar 기반 일정 관리
- **대시보드** - 상태별 통계, 도넛/바 차트, 기한 초과 목록

### 콘텐츠
- **위키** - Tiptap WYSIWYG 에디터, 트리 구조, 버전 히스토리
- **문서 관리** - 첨부파일 업로드/다운로드

### 활동 피드
- 글로벌/프로젝트별 활동 타임라인
- 이슈 생성/수정, 위키 편집, 문서 등록 집계
- 타입별 필터, 상대 시간 표시, 클릭 시 해당 리소스 이동

### 관리자
- 사용자, 역할, 트래커, 상태, 우선순위 관리
- 커스텀 필드 정의 (타입, 대상, 필수 여부, 선택 항목)
- 워크플로우 전이 규칙 설정

### 기타
- **글로벌 검색** - 이슈, 위키 통합 검색
- **다크 모드** - 라이트/다크 테마 전환
- **XSS 보호** - 서버(HtmlSanitizer) + 클라이언트(DOMPurify) 이중 방어
- **입력 검증** - FluentValidation 전체 DTO 적용

## 시작하기

### 사전 요구사항

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### 백엔드 실행

```bash
cd backend
dotnet run --project src/Nexmine.Api
```

`http://localhost:5000`에서 실행됩니다. Swagger UI: `http://localhost:5000/swagger`

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`에서 실행됩니다.

### 기본 계정

| 아이디 | 비밀번호 | 권한 |
|--------|----------|------|
| admin | admin | 관리자 |

## 테스트

```bash
# 백엔드 통합 테스트 (35개)
cd backend && dotnet test

# 프론트엔드 테스트 (24개)
cd frontend && npm test
```

## 프로젝트 구조

```
Nexmine/
├── backend/
│   ├── src/
│   │   ├── Nexmine.Api/            # 컨트롤러, 미들웨어
│   │   ├── Nexmine.Application/    # DTO, 서비스 인터페이스, 검증
│   │   │   └── Features/
│   │   │       ├── Auth/           # 인증/인가
│   │   │       ├── Projects/       # 프로젝트
│   │   │       ├── Issues/         # 이슈, 버전, 카테고리, 시간기록
│   │   │       ├── CustomFields/   # 커스텀 필드
│   │   │       ├── Workflows/      # 워크플로우 전이 규칙
│   │   │       ├── Activities/     # 활동 피드
│   │   │       ├── Wiki/           # 위키
│   │   │       ├── Documents/      # 문서
│   │   │       ├── Dashboard/      # 대시보드
│   │   │       ├── Search/         # 검색
│   │   │       └── Admin/          # 관리자
│   │   ├── Nexmine.Domain/         # 엔티티, 열거형
│   │   └── Nexmine.Infrastructure/ # DB, 서비스 구현, 인증
│   └── tests/
│       └── Nexmine.Api.IntegrationTests/
├── frontend/
│   └── src/
│       ├── api/generated/          # Orval 자동 생성 (수정 금지)
│       ├── components/             # 공통 컴포넌트, 레이아웃
│       ├── features/               # 기능별 모듈
│       │   ├── auth/               # 로그인, 회원가입
│       │   ├── projects/           # 프로젝트
│       │   ├── issues/             # 이슈
│       │   ├── kanban/             # 칸반 보드
│       │   ├── gantt/              # 간트차트
│       │   ├── calendar/           # 캘린더
│       │   ├── wiki/               # 위키
│       │   ├── documents/          # 문서
│       │   ├── dashboard/          # 대시보드
│       │   ├── activity/           # 활동 피드
│       │   ├── search/             # 검색
│       │   └── admin/              # 관리자
│       ├── stores/                 # Zustand 스토어
│       └── __tests__/              # 프론트엔드 테스트
└── claudeDoc/                      # 개발 규칙 문서
```

## API 클라이언트 재생성

백엔드 API 변경 후:

```bash
cd frontend && npx orval
```

## 라이선스

Private
