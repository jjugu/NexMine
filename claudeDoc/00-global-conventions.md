# Global Conventions - Nexmine 프로젝트 공통 규칙

## 1. 프로젝트 언어 정책
- **코드**: 영문 (변수명, 함수명, 클래스명, 주석 모두 영어)
- **UI 텍스트**: 한국어 (사용자에게 보이는 라벨, 메시지, 안내문)
- **문서**: 한국어 (claudeDoc, PLAN.md 등)
- **커밋 메시지**: 영문

## 2. C# 컨벤션 (Microsoft 공식 기준)
- **클래스/인터페이스**: `PascalCase` (예: `IssueService`, `IIssueService`)
- **메서드**: `PascalCase` (예: `GetByIdAsync`)
- **프로퍼티**: `PascalCase` (예: `CreatedAt`)
- **로컬 변수/파라미터**: `camelCase` (예: `issueId`)
- **private 필드**: `_camelCase` (예: `_dbContext`)
- **상수**: `PascalCase` (예: `MaxPageSize`)
- **Enum 값**: `PascalCase` (예: `InProgress`)
- **인터페이스**: `I` 접두사 (예: `IProjectService`)
- **비동기 메서드**: `Async` 접미사 (예: `CreateAsync`)
- **파일당 1개 public 클래스**, 파일명 = 클래스명

## 3. TypeScript 컨벤션 (Airbnb 기준)
- **컴포넌트**: `PascalCase` (예: `IssueList.tsx`)
- **함수/변수**: `camelCase` (예: `handleSubmit`)
- **타입/인터페이스**: `PascalCase` (예: `IssueDto`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_PAGE_SIZE`)
- **Enum**: `PascalCase` (값도 `PascalCase`)
- **커스텀 훅**: `use` 접두사 (예: `useAuth`)
- **이벤트 핸들러**: `handle` 접두사 (예: `handleClick`)
- **boolean 변수**: `is/has/can/should` 접두사 (예: `isLoading`)
- **파일명**: 컴포넌트는 `PascalCase.tsx`, 유틸/훅은 `camelCase.ts`

## 4. 폴더 구조 규칙
```
# Backend - 기능(Feature) 기반 구조
backend/src/Nexmine.Application/Features/{FeatureName}/
  ├── Dtos/
  ├── Interfaces/
  └── Validators/

# Frontend - 기능(Feature) 기반 구조  
frontend/src/features/{feature-name}/
  ├── components/
  ├── hooks/
  ├── stores/
  ├── types/
  └── index.ts          # public exports (barrel file)
```

## 5. Import 순서
### C#
```csharp
// 1. System 네임스페이스
// 2. Microsoft 네임스페이스
// 3. 서드파티 패키지
// 4. 프로젝트 내부 (Nexmine.Domain → Application → Infrastructure)
```

### TypeScript
```typescript
// 1. React / 외부 라이브러리
// 2. MUI 컴포넌트
// 3. 프로젝트 내부 (api → components → features → hooks → stores → types → utils)
// 4. 상대 경로 (같은 feature 내)
// 5. CSS / 스타일
```

## 6. Git 커밋 메시지 규칙
```
<type>(<scope>): <description>

type: feat, fix, refactor, docs, style, test, chore
scope: auth, project, issue, kanban, gantt, calendar, wiki, docs, api, ui
```
예시: `feat(issue): add issue filtering by status and priority`

## 7. 코드 품질 원칙
- **DRY**: 3회 이상 반복되면 추출
- **YAGNI**: 현재 필요한 것만 구현 (미래 요구사항 추측 금지)
- **단일 책임**: 하나의 클래스/함수는 하나의 역할
- **에러 처리**: 시스템 경계(API 입력, 외부 서비스)에서만 검증, 내부 코드는 신뢰
- **주석**: 코드가 "왜"를 설명할 수 없을 때만 작성

---

## 오류 기록

> 이 섹션에는 프로젝트 전반에 걸친 공통 오류와 해결책을 기록합니다.

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-07 | 백엔드 에러 메시지가 영어로 노출 | 서비스 레이어 throw 메시지를 영어로 작성 | 모든 사용자 노출 에러 메시지를 한국어로 변경 | 사용자에게 노출되는 에러 메시지는 반드시 한국어로 작성 |
| 2026-04-07 | 시간 표시가 UTC(오전 4시)로 나옴, 실제는 KST(오후 1시) | 백엔드 DateTime.UtcNow 저장 시 Z 접미사 없이 직렬화 → 프론트에서 로컬로 오해석 | formatDateTime에서 Z 접미사 추가하여 UTC로 파싱 후 브라우저 자동 변환 | DateTime 문자열은 항상 UTC 여부 확인 후 파싱, DateOnly는 시간대 변환 금지 |
| 2026-04-07 | 관리자 트래커/우선순위 순서 변경 버튼 무반응 | PUT API 호출 후 목록을 refetch하지 않거나, position 값 업데이트 로직 누락 | position swap 로직 구현 + 성공 후 invalidateQueries | 순서 변경 기능은 API 호출 → 성공 시 목록 refetch 패턴 필수 |
| 2026-04-07 | 트래커/우선순위 기본(isDefault) 설정 시 중복 허용됨 | 백엔드에서 isDefault=true 설정 시 기존 기본 항목의 isDefault를 false로 해제하지 않음 | 서비스에서 isDefault=true 업데이트 시 다른 항목들의 isDefault를 일괄 false로 변경 | isDefault 같은 단일 선택 플래그는 설정 시 반드시 기존 항목 해제 로직 포함 |
| 2026-04-08 | 시스템 설정 저장 시 빈 값(logo_url 등) 400 에러 | AdminSettingsController에서 Value를 IsNullOrWhiteSpace로 검증하여 빈 문자열 거부 | Value 필수 검증 제거, null일 때만 빈 문자열로 대체 | 시스템 설정 Value는 빈 문자열을 허용해야 함 (로고 URL 미설정 등) |
| 2026-04-08 | 여러 설정 동시 저장 시 성공→실패 Snackbar 교차 표시 | saveMutation.mutate를 forEach로 병렬 호출하면 onSuccess/onError가 각각 독립 트리거 | async/await로 순차 실행, 전체 성공/실패 후 1번만 Snackbar 표시 | 다수 API를 일괄 호출할 때 useMutation.mutate 반복 금지 → async/await 순차 호출 |
| 2026-04-08 | 로고 이미지 img 태그에서 로드 실패 | 첨부파일 다운로드 API가 [Authorize] → img 태그는 인증 헤더 미전송 | 공개 엔드포인트 GET /api/settings/logo 추가 (AllowAnonymous) | 인증 필요 파일을 img/favicon으로 표시할 때는 공개 다운로드 엔드포인트 필요 |
