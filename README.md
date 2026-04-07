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

- **프로젝트 관리** - 다중 프로젝트, 멤버십, 역할 기반 권한
- **이슈 트래킹** - CRUD, 필터링, 검색, 변경 이력(Journal), 시간 기록
- **칸반 보드** - 드래그 앤 드롭, 낙관적 업데이트
- **간트차트** - Day/Week/Month 뷰, 드래그 이동/리사이즈
- **캘린더** - FullCalendar 기반 일정 관리
- **위키 & 문서** - Tiptap WYSIWYG 에디터, 버전 히스토리, 첨부파일
- **대시보드** - 상태별 통계, 차트, 기한 초과 목록
- **관리자 패널** - 사용자, 역할, 트래커, 상태, 우선순위 관리
- **글로벌 검색** - 이슈, 위키 통합 검색
- **다크 모드** - 라이트/다크 테마 전환

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
# 백엔드 통합 테스트
cd backend && dotnet test

# 프론트엔드 테스트
cd frontend && npm test
```

## 프로젝트 구조

```
Nexmine/
├── backend/
│   ├── src/
│   │   ├── Nexmine.Api/            # 컨트롤러, 미들웨어
│   │   ├── Nexmine.Application/    # DTO, 서비스 인터페이스, 검증
│   │   ├── Nexmine.Domain/         # 엔티티, 열거형
│   │   └── Nexmine.Infrastructure/ # DB, 서비스 구현, 인증
│   └── tests/
│       └── Nexmine.Api.IntegrationTests/
├── frontend/
│   └── src/
│       ├── api/generated/          # Orval 자동 생성 (수정 금지)
│       ├── components/             # 공통 컴포넌트, 레이아웃
│       ├── features/               # 기능별 모듈
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
