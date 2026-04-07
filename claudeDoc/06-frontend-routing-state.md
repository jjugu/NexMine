# Frontend 라우팅 & 상태 관리 규칙

## 1. 라우팅 구조
- `react-router-dom` v7 사용
- **Lazy Loading**: 모든 feature 페이지는 `React.lazy()` + `Suspense`
- 레이아웃 중첩: `AuthLayout` (로그인/회원가입) / `AppLayout` (인증된 페이지)
- **Route Guard**: `ProtectedRoute` 컴포넌트로 인증 확인

```tsx
// App.tsx 라우트 구조
<Routes>
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/projects" element={<ProjectListPage />} />
    <Route path="/projects/:identifier/*" element={<ProjectRoutes />} />
    <Route path="/admin/*" element={<AdminRoutes />} />
  </Route>
</Routes>
```

## 2. URL 기반 상태 관리
필터, 페이지네이션, 정렬은 **URL searchParams**로 관리 (북마크/공유 가능)

```tsx
// 사용 패턴
const [searchParams, setSearchParams] = useSearchParams();
const page = Number(searchParams.get('page')) || 1;
const statusId = searchParams.get('statusId');
```

## 3. Zustand Store 규칙
- `src/stores/` 디렉토리에 위치
- Store당 하나의 파일, 하나의 관심사
- 서버 데이터를 Store에 저장하지 않음 (TanStack Query 사용)

```tsx
// 예시: authStore.ts
interface AuthState {
  user: UserDto | null;
  token: string | null;
  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'nexmine-auth' }
  )
);
```

## 4. Axios 설정 규칙
```tsx
// src/api/axiosInstance.ts
// 1. baseURL 설정 (Vite proxy 사용 시 상대경로)
// 2. Request 인터셉터: Authorization 헤더에 JWT 추가
// 3. Response 인터셉터: 401 → refresh token으로 자동 갱신 시도
// 4. 갱신 실패 시 → 로그아웃 + 로그인 페이지 리다이렉트
```

## 5. orval API 코드젠 규칙
- 설정 파일: `frontend/orval.config.ts`
- 출력 디렉토리: `src/api/generated/`
- 생성된 코드 **직접 수정 금지** (재생성 시 덮어쓰기됨)
- 커스텀 로직은 `src/api/` 상위 또는 feature hooks에서 래핑

## 6. 네비게이션 패턴
- 프로그래밍 방식: `useNavigate()` 훅
- 선언적 방식: `<Link>` 또는 MUI `<Button component={Link}>`
- 뒤로가기: `navigate(-1)` 또는 명시적 경로
- 프로젝트 컨텍스트: `useParams()`에서 `identifier` 추출

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| - | - | - | - | - |
