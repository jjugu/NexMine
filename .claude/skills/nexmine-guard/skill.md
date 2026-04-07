---
name: nexmine-guard
description: "Nexmine 프로젝트에서 파일을 편집하기 전에 해당 파일과 관련된 claudeDoc 규칙 문서를 자동으로 식별하고 로드한다. 코드를 작성하려 할 때, 파일을 수정하기 전에, 개발 작업을 시작할 때 반드시 이 스킬을 먼저 실행하라. 코드 편집이 수반되는 모든 작업에서 트리거."
---

# claudeDoc Guard — 파일-규칙 매핑 및 로드

코드 편집 전에 관련 claudeDoc 규칙 문서를 식별하여 Read하고, 오류 기록 테이블도 확인한다.

## 파일-문서 매핑 규칙

### Step 1: 전역 규칙 (항상 포함)
모든 파일 편집 시:
- `claudeDoc/00-global-conventions.md`

### Step 2: 레이어 규칙 (경로 기반)

| 파일 경로 패턴 | claudeDoc |
|---------------|-----------|
| `backend/**/Nexmine.Api/**` | `01-backend-api.md` |
| `backend/**/Nexmine.Domain/**` | `02-backend-domain.md` |
| `backend/**/Nexmine.Infrastructure/**` | `03-backend-infrastructure.md` |
| `backend/**/Nexmine.Application/**` | `01-backend-api.md` + `02-backend-domain.md` |
| `backend/**/*Auth*`, `*Token*`, `*Login*` | `04-backend-auth.md` |
| `frontend/src/components/**/*.tsx` | `05-frontend-components.md` |
| `frontend/src/features/**/components/**` | `05-frontend-components.md` |
| `frontend/src/stores/**` | `06-frontend-routing-state.md` |
| `frontend/src/api/**` | `06-frontend-routing-state.md` |
| `frontend/src/App.tsx`, `*route*` | `06-frontend-routing-state.md` |
| `frontend/src/**/*.tsx` (기타) | `05-frontend-components.md` + `06-frontend-routing-state.md` |
| `frontend/src/**/*.ts` (기타) | `06-frontend-routing-state.md` |

### Step 3: 모듈 규칙 (키워드 기반)

파일 경로 또는 파일명에 키워드가 포함되면 추가:

| 키워드 | claudeDoc |
|--------|-----------|
| `Issue`, `Journal`, `TimeEntry`, `Tracker`, `IssueStatus`, `IssuePriority`, `issues/` | `07-module-issues.md` |
| `Kanban`, `Board`, `kanban/` | `08-module-kanban.md` |
| `Gantt`, `gantt/` | `09-module-gantt.md` |
| `Calendar`, `calendar/` | `10-module-calendar.md` |
| `Wiki`, `Document`, `Attachment`, `wiki/`, `documents/` | `11-module-wiki.md` |
| `Dashboard`, `dashboard/` | `12-module-dashboard.md` |

### 복합 매핑 예시

| 작업 파일 | 로드할 claudeDoc |
|----------|-----------------|
| `backend/.../Controllers/IssuesController.cs` | 00, 01, 07 |
| `frontend/.../kanban/components/KanbanBoard.tsx` | 00, 05, 08 |
| `backend/.../Services/AuthService.cs` | 00, 03, 04 |
| `frontend/.../gantt/hooks/useGanttData.ts` | 00, 06, 09 |
| `backend/.../Entities/Issue.cs` | 00, 02, 07 |

## 실행 절차

1. 편집 대상 파일 목록을 수집한다
2. Step 1~3을 적용하여 관련 claudeDoc 목록을 산출한다 (중복 제거)
3. 산출된 모든 claudeDoc 파일을 Read한다
4. 각 문서의 **오류 기록** 테이블을 확인하고, 기존 오류 항목이 있으면 경고 요약한다
5. 결과를 반환한다
