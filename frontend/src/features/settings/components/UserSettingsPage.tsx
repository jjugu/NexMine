import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Button, Select, MenuItem,
  FormControl, InputLabel, FormControlLabel, Checkbox, Alert, Snackbar,
  CircularProgress, Skeleton, TextField, Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';

interface UserPreferenceDto {
  language: string;
  timezone: string;
  pageSize: number;
  theme: string;
  emailNotifications: boolean;
}

interface UpdateUserPreferenceRequest {
  language?: string;
  timezone?: string;
  pageSize?: number;
  theme?: string;
  emailNotifications?: boolean;
}

const TIMEZONES = [
  { value: 'Asia/Seoul', label: '(UTC+09:00) 서울' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) 도쿄' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) 상하이' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) 싱가포르' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) 뉴델리' },
  { value: 'Europe/London', label: '(UTC+00:00) 런던' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) 베를린' },
  { value: 'Europe/Paris', label: '(UTC+01:00) 파리' },
  { value: 'America/New_York', label: '(UTC-05:00) 뉴욕' },
  { value: 'America/Chicago', label: '(UTC-06:00) 시카고' },
  { value: 'America/Denver', label: '(UTC-07:00) 덴버' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) 로스앤젤레스' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) 오클랜드' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) 시드니' },
  { value: 'UTC', label: '(UTC+00:00) UTC' },
];

const PAGE_SIZES = [10, 25, 50, 100];

export default function UserSettingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { toggleMode, mode: currentThemeMode } = useThemeStore();
  const currentUser = useAuthStore((s) => s.user);

  const [language, setLanguage] = useState('ko');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [pageSize, setPageSize] = useState(25);
  const [theme, setTheme] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () =>
      axiosInstance.get<UserPreferenceDto>('/my/preferences').then((res) => res.data),
  });

  useEffect(() => {
    if (preferences) {
      setLanguage(preferences.language);
      setTimezone(preferences.timezone);
      setPageSize(preferences.pageSize);
      setTheme(preferences.theme);
      setEmailNotifications(preferences.emailNotifications);
    }
  }, [preferences]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPreferenceRequest) =>
      axiosInstance.put<UserPreferenceDto>('/my/preferences', data).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data);

      // Apply language change
      if (data.language !== i18n.language) {
        i18n.changeLanguage(data.language);
        localStorage.setItem('nexmine-language', data.language);
      }

      // Apply theme change
      const desiredMode = data.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : data.theme;
      if (desiredMode !== currentThemeMode) {
        toggleMode();
      }

      setSnackbar({ open: true, message: '환경설정이 저장되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '환경설정 저장에 실패했습니다.', severity: 'error' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      axiosInstance.put('/Auth/change-password', data),
    onSuccess: () => {
      setSnackbar({ open: true, message: '비밀번호가 변경되었습니다.', severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setPasswordError(axiosError.response?.data?.detail ?? '비밀번호 변경에 실패했습니다.');
    },
  });

  function handleChangePassword() {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  function handleSave() {
    updateMutation.mutate({
      language,
      timezone,
      pageSize,
      theme,
      emailNotifications,
    });
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>환경설정</Typography>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>환경설정</Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="language-label">언어</InputLabel>
            <Select
              labelId="language-label"
              value={language}
              label="언어"
              onChange={(e: SelectChangeEvent) => setLanguage(e.target.value)}
            >
              <MenuItem value="ko">한국어</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="timezone-label">시간대</InputLabel>
            <Select
              labelId="timezone-label"
              value={timezone}
              label="시간대"
              onChange={(e: SelectChangeEvent) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="pagesize-label">페이지당 항목 수</InputLabel>
            <Select
              labelId="pagesize-label"
              value={pageSize.toString()}
              label="페이지당 항목 수"
              onChange={(e: SelectChangeEvent) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <MenuItem key={size} value={size.toString()}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="theme-label">테마</InputLabel>
            <Select
              labelId="theme-label"
              value={theme}
              label="테마"
              onChange={(e: SelectChangeEvent) => setTheme(e.target.value)}
            >
              <MenuItem value="system">시스템</MenuItem>
              <MenuItem value="light">라이트</MenuItem>
              <MenuItem value="dark">다크</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            }
            label="이메일 알림"
          />

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            startIcon={updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
            sx={{ alignSelf: 'flex-start' }}
          >
            {updateMutation.isPending ? '저장 중...' : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change - only for non-Google users */}
      {(currentUser as { hasPassword?: boolean })?.hasPassword && (
        <Card sx={{ maxWidth: 600, mt: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">비밀번호 변경</Typography>
            <Divider />
            {passwordError && (
              <Alert severity="error" onClose={() => setPasswordError(null)}>
                {passwordError}
              </Alert>
            )}
            <TextField
              label="현재 비밀번호"
              type="password"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <TextField
              label="새 비밀번호"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="8자 이상"
              autoComplete="new-password"
            />
            <TextField
              label="새 비밀번호 확인"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              startIcon={changePasswordMutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
              sx={{ alignSelf: 'flex-start' }}
            >
              {changePasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
