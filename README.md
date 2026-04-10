<h1 align="center">Nexmine</h1>

<p align="center">
  <strong>Redmine 스타일 독립형 프로젝트 관리 웹 애플리케이션</strong><br>
  자체 DB · 자체 인증 · 자체 UI — 올인원 프로젝트 관리 도구
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/MUI-7-007FFF?logo=mui" alt="MUI 7">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/SignalR-Realtime-512BD4" alt="SignalR">
</p>

<p align="center">
  <a href="https://nexmine.kro.kr">https://nexmine.kro.kr</a>
</p>

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | ASP.NET Core 9, EF Core 9, SQLite |
| **Frontend** | React 19, TypeScript, Vite, MUI 7 |
| **상태관리** | TanStack Query (서버), Zustand (클라이언트) |
| **인증** | JWT + Refresh Token rotation, Google OAuth |
| **실시간** | SignalR WebSocket |
| **다국어** | react-i18next (한국어/영어) |
| **외부 연동** | Google Chat Webhook |
| **API 코드젠** | Swagger + Orval |
| **PDF** | QuestPDF |
| **테스트** | xUnit (백엔드), Vitest + Testing Library (프론트) |

## 주요 기능

### 프로젝트 관리
- 다중 프로젝트, 멤버십, 역할 기반 권한
- 프로젝트별 대시보드, 설정, 멤버 관리
- 모듈 on/off — 프로젝트별 위키/포럼/간트 등 사용 여부 토글
- 프로젝트 복사/템플릿 — 멤버, 이슈, 버전, 위키 등 선택적 복제

### 이슈 트래킹
- CRUD, 필터링, 검색, 변경 이력(Journal), 시간 기록
- 이슈 관계 (blocks, precedes, duplicates 등)
- 커스텀 필드 (텍스트, 정수, 실수, 날짜, 불린, 목록, 링크)
- 이슈 템플릿 — 트래커별 제목/설명 자동 채움
- 일괄 편집 — 여러 이슈 상태/담당자/우선순위 일괄 변경
- 이슈 복사/이동 — 같은/다른 프로젝트로 이슈 복제 또는 이동
- 첨부파일 — 이슈별 파일 업로드/다운로드/삭제
- 워쳐(감시자) — 이슈 변경 알림 대상 관리
- 저장된 필터 — 자주 쓰는 필터 조합 저장/공유, 사이드바 바로가기
- 컬럼 커스터마이징 — 이슈 목록 표시 컬럼 선택/순서 변경
- 컨텍스트 메뉴 — 우클릭으로 빠른 상태/담당자/우선순위 변경
- CSV import/export — 이슈 일괄 가져오기 및 내보내기
- PDF 내보내기 — 이슈 상세/목록 PDF 다운로드

### 워크플로우
- 역할+트래커별 상태 전이 규칙 매트릭스
- 관리자가 허용할 상태 전환을 체크박스로 설정
- 규칙 미정의 시 모든 전이 허용 (기본 동작)

### 시각화
- **칸반 보드** — 드래그 앤 드롭, 낙관적 업데이트
- **간트차트** — Day/Week/Month 뷰, 드래그 이동/리사이즈, 의존성 화살표, PDF 내보내기
- **캘린더** — FullCalendar 기반 일정 관리, 이벤트 드래그/리사이즈
- **대시보드** — 상태별 통계, 도넛/바 차트, 기한 초과 목록
- **로드맵** — 버전별 이슈 진행률 시각화

### 콘텐츠
- **위키** — Tiptap WYSIWYG 에디터, 트리 구조, 버전 히스토리
- **문서 관리** — 첨부파일 업로드/다운로드
- **뉴스** — 프로젝트별 공지사항 게시
- **포럼/게시판** — 주제+답글, 고정/잠금 기능

### 활동 피드
- 글로벌/프로젝트별 활동 타임라인
- 이슈 생성/수정, 위키 편집, 문서 등록 집계
- 타입별 필터, 상대 시간 표시

### 내 페이지 (My Page)
- 사용자별 커스터마이즈 가능한 위젯 대시보드
- 6종 위젯: 내 이슈, 감시 이슈, 기한 초과, 최근 활동, 시간 기록, 캘린더
- 2컬럼 레이아웃, 위젯 추가/제거/컬럼 배치

### 보고서
- 기간별/사용자별/프로젝트별 시간 집계 + CSV 다운로드

### 실시간 협업
- SignalR WebSocket 기반 실시간 통신
- 이슈 변경 시 프로젝트 멤버에게 토스트 알림
- 담당자 개인 알림 — 어느 페이지에 있든 할당/변경 알림 수신
- 이슈 동시 편집 감지 및 경고
- 현재 이슈 조회 중인 사용자 표시

### 외부 연동
- Google Chat Webhook — 프로젝트별 설정, 이슈 생성/수정/댓글 자동 알림
- 프로젝트 설정에서 Webhook URL 입력 + 테스트 전송

### 관리자
- 사용자, 역할, 트래커, 상태, 우선순위 관리
- 세밀한 권한 관리 — 37개 권한, 8개 그룹, 체크박스 매트릭스
- 사용자 그룹 — 그룹 단위 멤버 관리
- 커스텀 필드, 워크플로우, 이슈 템플릿 설정
- 시스템 설정 — 앱 이름, 세션 타임아웃, Google OAuth Client ID
- 테마 커스터마이징 — 색상(8 프리셋+커스텀), 로고/파비콘 업로드
- 회원가입 제어 — 자유가입/관리자 승인/가입 비활성화

### 인증
- JWT + Refresh Token rotation
- Google OAuth 로그인 — 관리자 설정에서 Client ID 입력, 자동 계정 생성/연동
- 자동 로그인 (Remember Me) — 체크 시 30일 세션 유지
- 회원가입 모드 관리자 설정

### 사용자 설정
- 언어, 시간대, 페이지당 항목 수, 테마, 이메일 알림 on/off
- 다국어 (i18n) — 한국어/영어 전환
- 다크 모드 — 라이트/다크 테마 전환

### 보안
- XSS 보호 — 서버(HtmlSanitizer) + 클라이언트(DOMPurify) 이중 방어
- 입력 검증 — FluentValidation 전체 DTO 적용
- 글로벌 검색 — 이슈, 위키 통합 검색

---

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
| `admin` | `admin` | 관리자 |

### Google OAuth 설정 (선택)

관리자 > 시스템 설정 > **Google OAuth Client ID** 입력 후 저장.
또는 환경변수: `VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com`

### Google Chat 연동 (선택)

프로젝트 > 설정 > **Google Chat 연동** > Webhook URL 입력 > 테스트 전송

---

## 테스트

```bash
# 백엔드 통합 테스트
cd backend && dotnet test

# 프론트엔드 테스트
cd frontend && npm test
```

---

## 프로젝트 구조

```
Nexmine/
├── backend/                         # ASP.NET Core 9 Web API
│   ├── src/
│   │   ├── Nexmine.Api/             # 컨트롤러, 미들웨어, SignalR Hub
│   │   ├── Nexmine.Application/     # DTO, 서비스 인터페이스, 검증
│   │   │   └── Features/            # 기능별 모듈 (25개)
│   │   ├── Nexmine.Domain/          # 엔티티(40개), 열거형
│   │   └── Nexmine.Infrastructure/  # DB, 서비스 구현, 인증
│   └── tests/
│       └── Nexmine.Api.IntegrationTests/
│
├── frontend/                        # React 19 + TypeScript + Vite
│   └── src/
│       ├── api/generated/           # Orval 자동 생성 (수정 금지)
│       ├── components/              # 공통 컴포넌트, 레이아웃
│       ├── features/                # 기능별 모듈 (17개)
│       ├── hooks/                   # SignalR 등 커스텀 훅
│       ├── i18n/                    # 다국어 번역 파일
│       ├── stores/                  # Zustand 스토어
│       └── theme/                   # MUI 테마 설정
│
└── claudeDoc/                       # 개발 규칙 문서 (13개)
```

### 아키텍처

```
Domain (의존성 없음) ← Application ← Infrastructure
                                         ↑
                                        Api
```

---

## API 클라이언트 재생성

백엔드 API 변경 후:

```bash
cd frontend && npx orval
```

## 배포

Oracle Cloud (Ubuntu) 기반 운영 환경:

- **Backend**: systemd 서비스 (`nexmine.service`) — Kestrel on port 5100
- **Frontend**: Nginx 정적 파일 서빙 + SPA 폴백
- **HTTPS**: Nginx reverse proxy + ZeroSSL 인증서
- **WebSocket**: Nginx에서 SignalR Hub (`/hubs/`) 프록시

```bash
# 빌드
cd backend && dotnet publish src/Nexmine.Api -c Release -o ./publish
cd frontend && npm run build

# 서버 배포
scp -r backend/publish/* user@server:/opt/nexmine/backend/
scp -r frontend/dist/* user@server:/opt/nexmine/frontend/
ssh user@server "sudo systemctl restart nexmine"
```

## 라이선스

Private
