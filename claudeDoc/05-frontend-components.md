# Frontend 컴포넌트 설계 규칙

## 1. 컴포넌트 분류
| 분류 | 위치 | 설명 |
|------|------|------|
| **Common** | `src/components/common/` | 재사용 가능한 범용 컴포넌트 (버튼, 모달 등) |
| **Layout** | `src/components/layout/` | 앱 레이아웃 (AppBar, Sidebar, Footer) |
| **Feature** | `src/features/{name}/components/` | 특정 기능 전용 컴포넌트 |

## 2. 컴포넌트 작성 규칙
```tsx
// 함수 선언식 사용 (arrow function export default 금지)
export default function IssueList({ projectId }: IssueListProps) {
  // 1. hooks (useState, useQuery, custom hooks)
  // 2. derived state / computed values
  // 3. event handlers
  // 4. early returns (loading, error)
  // 5. JSX return
}

// Props 인터페이스는 같은 파일 상단에 정의
interface IssueListProps {
  projectId: string;
}
```

## 3. 컴포넌트 크기 원칙
- **200줄 초과 시** 분리 검토
- 분리 기준: 독립적인 UI 블록, 재사용 가능성, 상태 관리 단위
- 분리 방법: 자식 컴포넌트 추출 또는 커스텀 훅 추출

## 4. 상태 관리 패턴
| 상태 종류 | 도구 | 사용 시점 |
|-----------|------|-----------|
| **서버 데이터** | TanStack Query | API에서 가져오는 모든 데이터 |
| **폼 상태** | react-hook-form | 폼 입력값, 유효성 검증 |
| **URL 상태** | react-router searchParams | 필터, 페이지네이션, 탭 |
| **UI 상태** | Zustand | 사이드바 열림/닫힘, 테마, 사용자 설정 |
| **로컬 UI 상태** | useState | 드롭다운 열림, 토글 등 컴포넌트 내부 상태 |

## 5. TanStack Query 사용 규칙
```tsx
// Query Key 네이밍: [리소스, ...파라미터]
const { data } = useQuery({
  queryKey: ['issues', projectId, filters],
  queryFn: () => api.getIssues(projectId, filters),
});

// Mutation 후 캐시 무효화
const mutation = useMutation({
  mutationFn: api.createIssue,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  },
});
```

## 6. 폼 패턴 (react-hook-form + zod)
```tsx
const schema = z.object({
  subject: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

## 7. 에러/로딩 처리 패턴
- **로딩**: MUI `Skeleton` 또는 `CircularProgress`
- **에러**: 토스트 알림 (`Snackbar`) + 인라인 에러 메시지
- **빈 상태**: 안내 메시지 + 액션 버튼 (예: "이슈가 없습니다. 첫 이슈를 만들어보세요")
- **Error Boundary**: 최상위 + 각 feature 라우트 단위

## 8. MUI 사용 규칙
- 인라인 `sx` prop 사용 (styled-components 별도 사용 안 함)
- 테마 색상 사용: `sx={{ color: 'primary.main' }}` (하드코딩 금지)
- 반응형: MUI `Grid2` + `useMediaQuery` 또는 `sx` breakpoints
- 아이콘: `@mui/icons-material`에서만 import

---

## 9. 반응형 디자인 규칙

### 지원 해상도
- **모바일**: 360px ~ 599px
- **태블릿**: 600px ~ 899px
- **FHD (16:9)**: 1920x1080
- **QHD (16:9)**: 2560x1440
- **UHD (16:9)**: 3840x2160
- **16:10 비율**: 1920x1200, 2560x1600
- **MacBook Air 13"**: CSS 1440x900 (Retina 2x, 물리 2560x1600)
- **MacBook Air 15"**: CSS 1440x932 (Retina 2x, 물리 2880x1864)
- **MacBook Pro 14"**: CSS 1512x982 (Retina 2x, 물리 3024x1964)
- **MacBook Pro 16"**: CSS 1728x1117 (Retina 2x, 물리 3456x2234)

> MacBook Retina는 CSS 해상도 기준 1440~1728px 범위. MUI lg(1200) ~ xl(1536) 구간에 걸치므로 이 구간의 레이아웃이 빈 공간 없이 채워지는지 반드시 확인할 것.

### MUI Breakpoints 설정
```typescript
// theme.ts
breakpoints: {
  values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
}
```

### 레이아웃 원칙
- **빈 공간 최소화**: 콘텐츠가 화면을 충분히 채우도록 `maxWidth`를 제한하되, 초광폭(UHD)에서는 Grid 컬럼을 늘려 공간 활용
- **Sidebar**: 데스크탑은 고정 240px, 태블릿은 접이식, 모바일은 Drawer
- **테이블/목록**: 모바일에서는 카드형 레이아웃으로 전환
- **폼**: 데스크탑 2~3열 Grid, 모바일 1열 풀폭
- **간트/캘린더**: 모바일에서는 가로 스크롤 허용 + 축소 뷰
- **칸반**: 모바일에서는 세로 아코디언 또는 가로 스크롤

### 반응형 구현 패턴
```tsx
// sx prop에서 breakpoint 사용
<Box sx={{
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',           // 모바일: 1열
    sm: '1fr 1fr',       // 태블릿: 2열
    lg: '1fr 1fr 1fr',   // 데스크탑: 3열
    xl: 'repeat(4, 1fr)' // UHD: 4열
  },
  gap: 2,
  p: { xs: 1, sm: 2, md: 3 }
}} />

// useMediaQuery로 조건부 렌더링
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

### 금지 사항
- `maxWidth: 1200px` 같은 고정 폭 컨테이너 사용 금지 (UHD에서 빈 공간 발생)
- 모바일에서 가로 스크롤이 불가피한 경우(간트, 캘린더) 외에는 가로 오버플로우 금지
- `px` 단위 고정 크기 남용 금지 → `%`, `fr`, MUI spacing 단위 우선

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-07 | entries.reduce is not a function (TimeEntrySection 크래시) | 백엔드 time-entries API가 배열이 아닌 페이지네이션 객체 `{items,totalCount}` 반환하는데 프론트가 배열로 기대 | `Array.isArray(data) ? data : data.items` 패턴으로 안전 파싱 | API 응답 타입이 배열인지 페이지네이션 객체인지 반드시 확인 후 파싱 |
| 2026-04-07 | Chrome 한국어 로케일에서 type="date" input에 `()` 요일 표시 | Chrome이 시스템 로케일(한국어)로 날짜 input을 렌더링, `lang="en"` 속성으로도 해결 불가 | `type="date"` 대신 MUI `@mui/x-date-pickers/DatePicker` 사용 | 날짜 입력에는 항상 MUI DatePicker 사용, 네이티브 type="date" 금지 |
| 2026-04-07 | MUI TextField shrink 미동작 — setValue로 값 넣을 때 라벨과 값 겹침 | react-hook-form의 setValue가 MUI TextField의 내부 상태를 트리거하지 않아 label shrink 미감지 | `InputLabelProps={{ shrink: !!watch('field') }}` 또는 Controller 사용 | 프로그래밍 방식으로 값 설정 시 shrink 상태 수동 관리 필요 |
| 2026-04-07 | vite.config.ts에 test 속성 추가 시 TS2769 타입 에러 | `import { defineConfig } from 'vite'`는 test 속성 미지원 | `import { defineConfig } from 'vitest/config'`로 변경 | Vitest 설정은 반드시 `vitest/config`에서 defineConfig를 import |
| 2026-04-07 | DOMPurify.Config 타입 TS2503 namespace 에러 | @types/dompurify 버전과 DOMPurify 버전 간 타입 불일치 | Config 타입 어노테이션 제거, 객체 리터럴로 추론 | DOMPurify config 객체에 타입 어노테이션 사용 시 버전 호환성 주의 |
| 2026-04-08 | GoogleLogin 컴포넌트에 locale prop 사용 시 TS2322 타입 에러 | @react-oauth/google v0.13.x의 GsiButtonConfiguration 타입에 locale 프로퍼티 미존재 | locale prop 제거 (Google 버튼은 브라우저 언어 설정을 자동 감지) | @react-oauth/google 사용 시 GoogleLogin props는 반드시 타입 정의 확인 후 사용 |
| 2026-04-09 | 기준정보(트래커/상태/우선순위) 관리자 추가/수정 후 이슈 폼에 미반영 | `useReferenceData` 훅의 `staleTime: Infinity`로 영구 캐시 + 관리자 mutation에서 공용 queryKey 미invalidate | staleTime을 5분으로 변경 + 관리자 CRUD onSuccess에 공용 queryKey invalidation 추가 | 기준정보 staleTime은 Infinity 금지, 관리자 CRUD 시 공용 queryKey도 반드시 invalidate |
| 2026-04-09 | 프로젝트 멤버 추가 시 역할이 영어로 표시 + 잘못된 ID | roleOptions를 하드코딩 (ID 3,4,5 / 영문명) → DB 실제값 (ID 1,2,3 / 한글명)과 불일치 | 하드코딩 제거, `GET /admin/roles` API에서 동적 조회 | 기준정보 목록은 하드코딩 금지, 반드시 API에서 동적 조회 |
| 2026-04-09 | 사이드바 접기/펼치기 시 깜박임 | `{sidebarOpen && <ListItemText>}` 조건부 마운트/언마운트로 width transition 중 레이아웃 점프 | 항상 렌더링 + opacity transition으로 변경, whiteSpace: nowrap 적용 | 애니메이션 중 요소 마운트/언마운트 금지, CSS opacity/visibility transition 사용 |
| 2026-04-10 | Vite build TS6133: 'getPriorityColor' is declared but its value is never read | 유틸 함수를 별도 컴포넌트로 이동 후 원래 파일에서 import 제거 안 함 | 미사용 import 제거 | 함수/유틸을 다른 파일로 이동할 때 원본 파일의 import도 정리할 것 |
