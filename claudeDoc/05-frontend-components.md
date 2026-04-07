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

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
