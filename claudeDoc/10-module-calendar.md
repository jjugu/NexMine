# 캘린더 모듈 규칙

## 1. 라이브러리
- `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` + `@fullcalendar/interaction`

## 2. 뷰 모드
| 뷰 | FullCalendar 뷰명 | 설명 |
|-----|-------------------|------|
| 월간 | `dayGridMonth` | 기본 뷰 |
| 주간 | `dayGridWeek` | 주 단위 |
| 일간 | `timeGridDay` | 일 단위 (필요 시) |

## 3. 이슈 → 캘린더 이벤트 매핑
```typescript
{
  id: issue.id.toString(),
  title: `#${issue.id} ${issue.subject}`,
  start: issue.startDate,
  end: issue.dueDate,          // FullCalendar는 end를 exclusive로 처리 → +1일 필요
  color: getTrackerColor(issue.trackerId),
  extendedProps: { issue }
}
```
- `dueDate`만 있는 이슈 → 해당 날짜에 점/칩으로 표시
- `startDate`만 있는 이슈 → 해당 날짜부터 오늘까지 바로 표시
- 둘 다 없는 이슈 → 캘린더에 미표시

## 4. 인터랙션
| 동작 | 결과 |
|------|------|
| 이벤트 클릭 | 이슈 상세 페이지/Drawer 열기 |
| 이벤트 드래그 | startDate/dueDate 변경 → API 호출 |
| 이벤트 리사이즈 | dueDate 변경 → API 호출 |
| 날짜 클릭 | 해당 날짜로 이슈 생성 폼 열기 |

## 5. 색상 규칙
| 기준 | 색상 매핑 |
|------|-----------|
| Tracker | Bug=빨강, Feature=파랑, Task=녹색, Support=주황 |
| 또는 Priority | Immediate=빨강, High=주황, Normal=파랑, Low=회색 |
- 사용자가 토글로 색상 기준 선택 가능

## 6. API 호출 최적화
- 캘린더 뷰 변경 시 `datesSet` 콜백에서 현재 보이는 날짜 범위로 API 호출
- `GET /api/projects/{id}/calendar?start=2026-04-01&end=2026-04-30`
- 불필요한 재요청 방지: TanStack Query 캐싱 활용

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-08 | 캘린더 월 이동 시 깜빡임 | 날짜 범위 변경 시 queryKey가 바뀌어 이전 데이터가 사라짐 | useQuery에 placeholderData: (prev) => prev 추가 | 날짜 범위/필터 변경으로 queryKey가 바뀌는 쿼리에는 placeholderData로 이전 데이터 유지 |
| 2026-04-08 | 다크모드에서 캘린더 셀/헤더가 흰색 | FullCalendar 자체 CSS가 다크모드 미지원 | .fc-theme-standard td/th, .fc-daygrid-day 등에 MUI 테마 색상 오버라이드 | FullCalendar 사용 시 다크모드 CSS 오버라이드 필수 (borderColor: divider, bgcolor: background.default) |
