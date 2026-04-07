---
name: nexmine-verify
description: "Nexmine Backend/Frontend 빌드를 실행하여 오류를 탐지하고, 발견된 오류를 해당 claudeDoc 오류 기록 테이블에 자동 기록한다. 코드를 수정한 후, '빌드 확인', '검증', '오류 체크' 요청 시 트리거. 코드 편집 완료 후 항상 실행하라."
---

# 빌드 검증 + 오류 기록

코드 편집 후 빌드를 실행하여 오류를 즉시 탐지하고, claudeDoc에 자동 기록한다.

## 빌드 명령어

### Backend
```bash
cd C:/Claude/Nexmine/backend && dotnet build Nexmine.sln --no-restore 2>&1
```
- 성공: `Build succeeded` + exit code 0
- 실패: `error CS` 또는 `Build FAILED`

### Frontend 타입 체크
```bash
cd C:/Claude/Nexmine/frontend && npx tsc --noEmit 2>&1
```
- 성공: 출력 비어있음 + exit code 0
- 실패: `error TS` 포함

### Frontend 빌드
```bash
cd C:/Claude/Nexmine/frontend && npm run build 2>&1
```

### orval API 재생성 (API 시그니처 변경 시만)
```bash
cd C:/Claude/Nexmine/frontend && npx orval 2>&1
```
orval 실행 후 반드시 Frontend 타입 체크를 다시 수행한다.

## 빌드 실행 전략

| 변경 영역 | 실행 순서 |
|-----------|----------|
| backend만 | dotnet build |
| frontend만 | tsc --noEmit → npm run build |
| both | dotnet build → (orval if API 변경) → tsc --noEmit → npm run build |

Backend 빌드 실패 시 Frontend 빌드로 넘어가지 않는다.

## 오류 파싱

### C# 오류
```
패턴: {파일}({행},{열}): error CS{코드}: {메시지}
```

### TypeScript 오류
```
패턴: {파일}({행},{열}): error TS{코드}: {메시지}
```

## 오류 기록 절차

### 1. 오류-문서 매핑
오류 발생 파일을 nexmine-guard 매핑 규칙으로 해당 claudeDoc을 특정한다. 매핑 불가 시 `00-global-conventions.md`에 기록.

### 2. 중복 확인
해당 claudeDoc 오류 기록 테이블에서 동일 오류 코드(CS/TS)가 이미 있으면 중복 기록하지 않는다.

### 3. 기록 형식
```markdown
| 2026-04-07 | CS1061: IIssueService에 GetAllAsync 정의 없음 | Application 인터페이스에 메서드 미선언 | IIssueService에 메서드 추가 | 서비스 인터페이스 변경 시 구현체와 컨트롤러 동시 확인 |
```

필드:
- **날짜**: YYYY-MM-DD
- **오류 내용**: 오류 코드 + 핵심 메시지 (한국어)
- **원인**: 근본 원인 분석
- **해결책**: 수정 방법
- **방지 규칙**: 재발 방지를 위한 개발 규칙

### 4. 테이블에 추가
해당 claudeDoc의 `## 오류 기록` 섹션 테이블에 새 행을 추가한다. placeholder `| - |` 행이 있으면 교체한다.
