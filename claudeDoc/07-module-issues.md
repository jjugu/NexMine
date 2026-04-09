# 이슈 관리 모듈 규칙

## 1. 이슈 데이터 흐름
```
[Frontend Form] → CreateIssueRequest DTO
  → [Controller] 유효성 검증
  → [Service] 비즈니스 로직 + DB 저장
  → [Service] Journal 자동 생성 (수정 시)
  → IssueDto/IssueDetailDto 반환
```

## 2. 이슈 상태 전이 규칙
- **워크플로우(WorkflowTransition)**: 역할+트래커별 허용 상태 전이 매트릭스
- 워크플로우 규칙이 없는 역할+트래커 조합은 **모든 전이 허용** (기본 동작)
- Admin 사용자는 워크플로우 제한 없이 모든 전이 허용
- `IsClosed=true` 상태로 변경 시 `DoneRatio=100` 자동 설정
- 상태 변경은 Journal로 기록
- API: `GET /api/issues/{id}/allowed-statuses` → 현재 사용자 역할 기반 허용 상태 반환

## 3. Journal (변경 이력) 자동 생성
이슈 업데이트 시 Service에서 변경 전후 값을 비교하여 `Journal` + `JournalDetail` 자동 생성:
```
감지 대상 필드: Subject, Description, StatusId, TrackerId, PriorityId, 
AssignedToId, CategoryId, VersionId, StartDate, DueDate, 
DoneRatio, EstimatedHours, IsPrivate
```

## 4. 이슈 필터링 스펙
| 필터 파라미터 | 타입 | 설명 |
|--------------|------|------|
| `trackerId` | int[] | 트래커 (Bug, Feature 등) |
| `statusId` | int[] | 상태 (New, In Progress 등) |
| `priorityId` | int[] | 우선순위 |
| `assignedToId` | int? | 담당자 (0 = 미할당) |
| `authorId` | int? | 작성자 |
| `categoryId` | int? | 카테고리 |
| `versionId` | int? | 대상 버전 |
| `parentIssueId` | int? | 부모 이슈 |
| `search` | string? | 제목+설명 텍스트 검색 |
| `startDateFrom/To` | DateOnly? | 시작일 범위 |
| `dueDateFrom/To` | DateOnly? | 종료일 범위 |
| `isClosed` | bool? | 완료 여부 |

## 5. 이슈 번호 체계
- 프로젝트와 무관한 **글로벌 자동 증가 ID** (Redmine과 동일)
- 표시 형식: `#123`

## 6. 프론트엔드 이슈 목록 주의사항
- 필터 상태는 URL searchParams로 관리 (새로고침/공유 시 유지)
- 목록은 항상 페이지네이션 적용
- 기본 정렬: `createdAt DESC`
- 컬럼 정렬 클릭 시 `sortBy`, `sortDir` 파라미터 변경

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-09 | 이슈 상태 변경 시 Journal에 이름 대신 숫자 ID 저장 (상태 1→2) | `UpdatePositionAsync`에서 `issue.StatusId.ToString()`으로 ID를 문자열화하여 저장 | `FindAsync`로 이름 조회 후 Name을 저장하도록 수정 | Journal OldValue/NewValue에 FK ID 저장 금지, 반드시 이름(Name)으로 해석하여 저장 |
