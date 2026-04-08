# 간트차트 모듈 규칙

## 1. 데이터 요구사항
간트차트에 필요한 이슈 필드:
- `id`, `subject`, `startDate`, `dueDate` (필수 - 둘 다 없으면 간트에 미표시)
- `doneRatio` (진행률 바)
- `parentIssueId` (트리 구조)
- `relations` (precedes/follows → 의존성 화살표)
- `assignedTo` (담당자 표시)
- `tracker`, `priority` (색상 구분)

## 2. 뷰 모드
| 모드 | 단위 | 헤더 표시 |
|------|------|-----------|
| Day | 1일 | 날짜 (4/7, 4/8...) |
| Week | 1주 | 주차 (W14, W15...) |
| Month | 1개월 | 월 (2026-04, 2026-05...) |

## 3. 인터랙션
| 동작 | 결과 | API 호출 |
|------|------|----------|
| 바 좌우 드래그 | 일정 이동 (startDate + dueDate 동시 변경) | `PUT /api/issues/{id}` |
| 바 우측 끝 드래그 | 종료일 변경 | `PUT /api/issues/{id}` |
| 바 좌측 끝 드래그 | 시작일 변경 | `PUT /api/issues/{id}` |
| 바 클릭 | 이슈 상세 열기 | 라우팅 또는 Drawer |
| 마우스 휠 | 가로 스크롤 (타임라인 이동) | - |

## 4. 의존성 화살표
- `precedes` 관계만 화살표로 표시 (A → B = A 끝나야 B 시작)
- SVG `<path>` 또는 `<line>`으로 렌더링
- 색상: 회색 기본, 위반 시 빨간색 (B.startDate < A.dueDate)

## 5. 렌더링 전략
- **가상화**: 뷰포트에 보이는 행만 렌더링 (100개 이상 이슈 시 성능)
- 좌측 패널: 이슈 목록 (고정)
- 우측 패널: 타임라인 (스크롤)
- 오늘 날짜 빨간색 세로선 표시

## 6. 라이브러리 선택
- **frappe-gantt** 우선 시도 → 커스터마이징 한계 시 Custom SVG 전환
- Custom SVG 구현 시 `dayjs`로 날짜 계산

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-07 | 간트 바 드래그 시 클릭 판정되어 이슈 상세로 이동 | mouseDown→mouseUp 사이에 이동량 체크 없이 onClick 발생 | 드래그 시작 시 마우스 이동량 추적, 3px 미만 이동만 클릭으로 판정 (wasDragged ref) | 드래그+클릭 공존 시 반드시 이동 임계값(threshold)으로 구분 |
| 2026-04-07 | 간트 바 드래그 시 버벅거림 | setDragOffset가 매 mousemove마다 React 리렌더링 유발 | 이동(move) 드래그는 CSS translateX로 DOM 직접 조작, mouseUp에서만 React 상태 업데이트 | SVG 드래그는 React state 대신 DOM 직접 조작(transform) 사용, 리사이즈만 state 사용 |
| 2026-04-08 | 다크모드에서 간트 헤더/주말 배경이 흰색 | SVG fill에 palette.grey[50], grey[100] 하드코딩 | palette.background.default, palette.action.hover로 변경 | SVG fill 색상도 muiTheme.palette 시맨틱 토큰 사용, grey.N 하드코딩 금지 |
