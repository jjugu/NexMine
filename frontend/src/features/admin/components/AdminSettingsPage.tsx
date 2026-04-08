import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Radio, RadioGroup, FormControl, FormControlLabel, FormLabel,
  Snackbar, Alert, Skeleton, CircularProgress, Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import axiosInstance from '../../../api/axiosInstance';

const PRESET_COLORS = [
  { value: '#1976d2', label: '파랑 (기본)' },
  { value: '#388e3c', label: '초록' },
  { value: '#d32f2f', label: '빨강' },
  { value: '#7b1fa2', label: '보라' },
  { value: '#f57c00', label: '주황' },
  { value: '#455a64', label: '회색' },
  { value: '#00838f', label: '청록' },
  { value: '#c2185b', label: '핑크' },
];

interface AdminSettings {
  registration_mode: string;
  app_name: string;
  app_description: string;
  session_timeout_minutes: string;
  primary_color: string;
  logo_url: string;
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [registrationMode, setRegistrationMode] = useState<string>('open');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [customColor, setCustomColor] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => axiosInstance.get<AdminSettings>('/admin/settings').then((res) => res.data),
  });

  useEffect(() => {
    if (settings) {
      if (settings.registration_mode) {
        setRegistrationMode(settings.registration_mode);
      }
      setAppName(settings.app_name ?? '');
      setAppDescription(settings.app_description ?? '');
      setSessionTimeout(settings.session_timeout_minutes ?? '');
      setPrimaryColor(settings.primary_color || '#1976d2');
      setLogoUrl(settings.logo_url ?? '');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      axiosInstance.put('/admin/settings', { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      setSnackbar({ open: true, message: '설정이 저장되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '설정 저장에 실패했습니다.', severity: 'error' });
    },
  });

  function handleSaveRegistrationMode() {
    saveMutation.mutate({ key: 'registration_mode', value: registrationMode });
  }

  async function handleSaveAppSettings() {
    try {
      await axiosInstance.put('/admin/settings', { key: 'app_name', value: appName });
      await axiosInstance.put('/admin/settings', { key: 'app_description', value: appDescription });
      await axiosInstance.put('/admin/settings', { key: 'session_timeout_minutes', value: sessionTimeout });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      setSnackbar({ open: true, message: '설정이 저장되었습니다.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: '설정 저장에 실패했습니다.', severity: 'error' });
    }
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>시스템 설정</Typography>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="rectangular" height={160} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>시스템 설정</Typography>
        <Alert severity="error">설정을 불러오는데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>시스템 설정</Typography>

      {/* Registration mode section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              회원가입 모드
            </FormLabel>
            <RadioGroup
              value={registrationMode}
              onChange={(e) => setRegistrationMode(e.target.value)}
            >
              <FormControlLabel
                value="open"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">자유 가입</Typography>
                    <Typography variant="body2" color="text.secondary">
                      누구나 가입 가능합니다.
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { mt: -0.5 } }}
              />
              <FormControlLabel
                value="approval"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">관리자 승인</Typography>
                    <Typography variant="body2" color="text.secondary">
                      가입 후 관리자 승인이 필요합니다.
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { mt: -0.5 } }}
              />
              <FormControlLabel
                value="disabled"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">가입 비활성화</Typography>
                    <Typography variant="body2" color="text.secondary">
                      관리자만 계정을 생성할 수 있습니다.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { mt: -0.5 } }}
              />
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveRegistrationMode}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* App settings section */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            앱 설정
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="앱 이름"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Nexmine"
              fullWidth
            />
            <TextField
              label="앱 설명"
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="프로젝트 관리 시스템"
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="기본 세션 타임아웃 (분)"
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              placeholder="30"
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ maxWidth: 280 }}
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveAppSettings}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '저장 중...' : '전체 저장'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Theme settings section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            테마 설정
          </Typography>

          {/* Color palette */}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            기본 색상
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {PRESET_COLORS.map((color) => (
              <Tooltip title={color.label} key={color.value}>
                <Box
                  onClick={() => {
                    setPrimaryColor(color.value);
                    setCustomColor('');
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: color.value,
                    cursor: 'pointer',
                    border: primaryColor === color.value ? '3px solid' : '2px solid transparent',
                    borderColor: primaryColor === color.value ? 'text.primary' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s',
                    '&:hover': { opacity: 0.85 },
                  }}
                >
                  {primaryColor === color.value && (
                    <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Custom hex input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TextField
              label="커스텀 HEX 색상"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                setCustomColor(val);
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                  setPrimaryColor(val);
                }
              }}
              placeholder="#1976d2"
              sx={{ width: 200 }}
            />
            {customColor && /^#[0-9a-fA-F]{6}$/.test(customColor) && (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: customColor,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            )}
          </Box>

          {/* Logo Upload */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>로고</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Button variant="outlined" component="label" size="small">
              파일 업로드
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('attachableType', 'system');
                  formData.append('attachableId', '0');
                  try {
                    const res = await axiosInstance.post('/attachments', formData);
                    const uploaded = res.data;
                    const downloadUrl = `/api/attachments/${uploaded.id}/download`;
                    setLogoUrl(downloadUrl);
                    setSnackbar({ open: true, message: '로고가 업로드되었습니다.', severity: 'success' });
                  } catch {
                    setSnackbar({ open: true, message: '로고 업로드에 실패했습니다.', severity: 'error' });
                  }
                  e.target.value = '';
                }}
              />
            </Button>
            <TextField
              label="또는 URL 직접 입력"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              size="small"
              sx={{ flex: 1 }}
            />
            {logoUrl && (
              <Button size="small" color="error" onClick={() => setLogoUrl('')}>제거</Button>
            )}
          </Box>
          {logoUrl && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                미리보기
              </Typography>
              <Box
                component="img"
                src={logoUrl}
                alt="로고 미리보기"
                sx={{ height: 40, maxWidth: 200, objectFit: 'contain' }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={async () => {
                try {
                  await axiosInstance.put('/admin/settings', { key: 'primary_color', value: primaryColor });
                  await axiosInstance.put('/admin/settings', { key: 'logo_url', value: logoUrl });
                  queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
                  queryClient.invalidateQueries({ queryKey: ['app-settings'] });
                  setSnackbar({ open: true, message: '테마가 저장되었습니다.', severity: 'success' });
                } catch {
                  setSnackbar({ open: true, message: '테마 저장에 실패했습니다.', severity: 'error' });
                }
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '저장 중...' : '테마 저장'}
            </Button>
          </Box>
        </CardContent>
      </Card>

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
