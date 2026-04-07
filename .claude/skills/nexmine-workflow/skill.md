---
name: nexmine-workflow
description: "Nexmine 개발 워크플로우 오케스트레이터. claudeDoc 규칙 로드 → 코드 개발 → 빌드 검증 → 오류 기록의 전체 사이클을 자동 조율한다. '개발해줘', '구현해줘', '기능 추가', '코드 작성', '만들어줘' 등 코드 작성이 수반되는 모든 요청에 트리거. 단순 질문이나 설계 상담은 트리거하지 않는다."
---

# Nexmine 개발 워크플로우 오케스트레이터

## 실행 모드: Generate-Verify

nexmine-dev가 코드를 작성하고, nexmine-qa가 빌드를 검증한다.

## 워크플로우

### Phase 1: 작업 분석 + 규칙 로드 (Guard)

1. 사용자 요청을 분석하여 파악한다:
   - 변경 영역: backend / frontend / both
   - 관련 모듈: issues, kanban, gantt, calendar, wiki, dashboard
   - 예상 변경 파일 목록

2. nexmine-guard 스킬의 매핑 규칙으로 관련 claudeDoc 목록을 산출한다.

3. 산출된 모든 claudeDoc를 Read하고 핵심 규칙과 과거 오류를 확인한다.

4. `PLAN.md`를 Read하여 현재 Phase를 확인한다.

### Phase 2: 코드 개발 (Generate)

**단순 작업** (1~3개 파일, 단일 영역):
- 에이전트 팀 없이 오케스트레이터가 직접 코드를 작성한다.
- Phase 1에서 로드한 규칙을 준수한다.

**복잡 작업** (4개+ 파일, 또는 Backend+Frontend 동시 변경):
- TeamCreate로 nexmine-dev + nexmine-qa 팀을 구성한다.
- nexmine-dev에게 작업 지시 + claudeDoc 규칙 요약 + 과거 오류 경고를 전달한다.

### Phase 3: 빌드 검증 (Verify)

nexmine-verify 스킬 절차에 따라 빌드를 실행한다.

- **성공**: Phase 4로 진행
- **실패**: Phase 3-R(수정 루프)로 진행

### Phase 3-R: 수정 루프 (최대 3회)

1. 오류 목록을 nexmine-dev에게 전달 (또는 직접 수정)
2. 수정 후 재검증
3. 3회 초과 실패 시 사용자에게 보고하고 수동 개입 요청

### Phase 4: 완료 보고

```
작업 완료: [작업 요약]

변경 파일:
- [파일 목록]

빌드 검증: Backend [결과] | Frontend [결과]
오류 기록: [N건 — 기록된 문서명]
참조한 규칙 문서: [번호 목록]
```

## 단순/복잡 판단 기준

| 조건 | 모드 |
|------|------|
| 단일 영역 + 파일 3개 이하 | 단순 (직접 처리) |
| Backend + Frontend 동시 | 복잡 (팀 모드) |
| 파일 4개 이상 | 복잡 (팀 모드) |

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| claudeDoc 없음 | 경고 후 00만 참조 |
| backend/ 없음 | PLAN.md Phase 0 스캐폴딩 수행 |
| frontend/ 없음 | 위와 동일 |
| 빌드 도구 미설치 | 사용자에게 안내, 빌드 검증 스킵 |
| 수정 루프 3회 초과 | 전체 오류 히스토리를 사용자에게 보고 |
| 에이전트 실패 | 오케스트레이터가 직접 처리로 전환 |
