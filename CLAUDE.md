# Nexmine - Claude Code 작업 지침서

## 프로젝트
Redmine 스타일 독립형 프로젝트 관리 웹앱 (자체 DB/인증/UI)
- **Backend**: ASP.NET Core 9 + EF Core 9 + SQLite
- **Frontend**: React 19 + TypeScript + Vite + MUI 7

## 작업 절차 (매 세션, 매 작업 시 반드시 따를 것)

### 1. 계획 확인
- `PLAN.md` 읽고 현재 진행 중인 Phase 파악

### 2. 규칙 문서 읽기 (코드 작성 전 필수)
작업할 영역의 `claudeDoc/` 문서를 **반드시 먼저 Read**:
- 공통 규칙 → `claudeDoc/00-global-conventions.md`
- Backend API → `claudeDoc/01-backend-api.md`
- Domain 엔티티 → `claudeDoc/02-backend-domain.md`
- Infrastructure → `claudeDoc/03-backend-infrastructure.md`
- 인증/인가 → `claudeDoc/04-backend-auth.md`
- 컴포넌트 → `claudeDoc/05-frontend-components.md`
- 라우팅/상태 → `claudeDoc/06-frontend-routing-state.md`
- 이슈 모듈 → `claudeDoc/07-module-issues.md`
- 칸반 → `claudeDoc/08-module-kanban.md`
- 간트 → `claudeDoc/09-module-gantt.md`
- 캘린더 → `claudeDoc/10-module-calendar.md`
- 위키/문서 → `claudeDoc/11-module-wiki.md`
- 대시보드 → `claudeDoc/12-module-dashboard.md`

### 3. 오류 기록 확인
각 문서 하단의 **오류 기록** 테이블을 확인하여 과거 오류를 반복하지 않도록 한다.

### 4. 오류 발생 시 즉시 기록
해당 모듈의 `claudeDoc/` 문서 하단 오류 기록 테이블에 추가:
```
| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
```
기록 대상: 빌드 실패, 런타임 에러, 타입 에러, 설계 실수, 라이브러리 호환성 문제

## 하네스 (자동화 에이전트)

코드 작성 작업 시 `.claude/skills/nexmine-workflow/skill.md`의 워크플로우를 따른다:
1. **Guard** → nexmine-guard 스킬로 파일-claudeDoc 매핑, 규칙 로드
2. **Generate** → 코드 작성 (단순: 직접, 복잡: nexmine-dev 에이전트)
3. **Verify** → nexmine-verify 스킬로 빌드 검증 + 오류 자동 기록
4. **Report** → 완료 보고

에이전트 정의: `.claude/agents/nexmine-dev.md`, `.claude/agents/nexmine-qa.md`

## 개발 명령어
```bash
# 백엔드
cd C:/Claude/Nexmine/backend && dotnet run --project src/Nexmine.Api
# 프론트엔드
cd C:/Claude/Nexmine/frontend && npm run dev
# API 클라이언트 재생성
cd C:/Claude/Nexmine/frontend && npx orval
# EF Migration
cd C:/Claude/Nexmine/backend && dotnet ef migrations add [Name] --project src/Nexmine.Infrastructure --startup-project src/Nexmine.Api
```
