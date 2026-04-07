# 칸반 보드 모듈 규칙

## 1. 칸반 구조
- **컬럼** = `IssueStatus` (Position 순서대로)
- **카드** = 해당 Status의 Issue (Position 순서대로)
- IsClosed=true인 Status는 칸반 보드 우측 끝에 축소 표시

## 2. 드래그 앤 드롭 동작
| 동작 | API 호출 | 변경 필드 |
|------|----------|-----------|
| 같은 컬럼 내 순서 변경 | `PUT /api/issues/{id}/position` | `Position` |
| 다른 컬럼으로 이동 | `PUT /api/issues/{id}/position` | `StatusId` + `Position` |

## 3. Position 관리 전략
- Position 값: 10000 단위 간격 (처음: 10000, 20000, 30000...)
- 사이에 삽입 시: 중간값 계산 (예: 10000과 20000 사이 → 15000)
- 간격이 1 이하로 좁아지면 해당 컬럼 전체 Position 재정렬 (10000 간격으로)

## 4. 낙관적 업데이트 (Optimistic Update)
```tsx
// 드래그 완료 즉시 UI 업데이트 → API 호출 → 실패 시 롤백
onDragEnd: (result) => {
  // 1. 즉시 로컬 상태 업데이트
  // 2. API mutation 호출
  // 3. onError → queryClient.invalidateQueries로 서버 상태 복원
}
```

## 5. 카드 표시 정보
- 이슈 번호 (`#123`)
- 제목 (Subject)
- 트래커 아이콘/라벨
- 우선순위 색상 바
- 담당자 아바타
- 진행률 바 (DoneRatio)

## 6. 라이브러리 규칙 (@hello-pangea/dnd)
- `DragDropContext` → 페이지 최상위
- `Droppable` → 각 Status 컬럼
- `Draggable` → 각 Issue 카드
- `droppableId` = `status-{statusId}`
- `draggableId` = `issue-{issueId}`

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
