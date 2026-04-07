# Nexmine - claudeDoc 개발 규칙 문서

개발 시 반드시 참조해야 하는 모듈별 규칙과 오류 기록을 관리합니다.
각 문서 하단의 **오류 기록** 테이블에 해당 모듈에서 발생한 오류와 해결책을 누적 기록합니다.

## 문서 목록

| 파일 | 내용 |
|------|------|
| [00-global-conventions.md](00-global-conventions.md) | 프로젝트 공통 규칙 (네이밍, import 순서, 커밋, 코드 품질) |
| [01-backend-api.md](01-backend-api.md) | API 설계 규칙 (엔드포인트, 응답 형식, 에러 코드, DTO) |
| [02-backend-domain.md](02-backend-domain.md) | Domain 레이어 규칙 (엔티티, Enum, 관계, Seed) |
| [03-backend-infrastructure.md](03-backend-infrastructure.md) | Infrastructure 규칙 (DbContext, Repository, DI, JWT, 파일저장) |
| [04-backend-auth.md](04-backend-auth.md) | 인증/인가 규칙 (JWT 플로우, 권한 레벨, 보안) |
| [05-frontend-components.md](05-frontend-components.md) | 컴포넌트 설계 규칙 (분류, 작성법, 상태관리, MUI) |
| [06-frontend-routing-state.md](06-frontend-routing-state.md) | 라우팅 & 상태 관리 (URL 상태, Zustand, Axios, orval) |
| [07-module-issues.md](07-module-issues.md) | 이슈 관리 모듈 (상태 전이, Journal, 필터링) |
| [08-module-kanban.md](08-module-kanban.md) | 칸반 보드 모듈 (DnD, Position 관리, 낙관적 업데이트) |
| [09-module-gantt.md](09-module-gantt.md) | 간트차트 모듈 (뷰 모드, 인터랙션, 의존성 화살표) |
| [10-module-calendar.md](10-module-calendar.md) | 캘린더 모듈 (FullCalendar, 이벤트 매핑, 색상) |
| [11-module-wiki.md](11-module-wiki.md) | 위키 & 문서 모듈 (Tiptap 에디터, 버전 관리, 첨부파일) |
| [12-module-dashboard.md](12-module-dashboard.md) | 대시보드 모듈 (위젯, 통계, 차트) |

## 오류 기록 규칙

개발 중 오류 발생 시 해당 모듈 문서의 **오류 기록** 테이블에 다음 형식으로 추가:

```
| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
```

- **날짜**: 발생일 (YYYY-MM-DD)
- **오류 내용**: 에러 메시지 또는 증상 요약
- **원인**: 근본 원인 분석
- **해결책**: 적용한 수정 내용
- **방지 규칙**: 향후 같은 오류를 방지하기 위한 규칙 (이후 개발에 반영)
