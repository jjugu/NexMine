import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Button,
  Radio, RadioGroup, FormControl, FormControlLabel, FormLabel,
  Snackbar, Alert, Skeleton, CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import axiosInstance from '../../../api/axiosInstance';

interface AdminSettings {
  registration_mode: string;
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [registrationMode, setRegistrationMode] = useState<string>('open');
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
    if (settings?.registration_mode) {
      setRegistrationMode(settings.registration_mode);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (value: string) =>
      axiosInstance.put('/admin/settings', { key: 'registration_mode', value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setSnackbar({ open: true, message: '설정이 저장되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '설정 저장에 실패했습니다.', severity: 'error' });
    },
  });

  function handleSave() {
    saveMutation.mutate(registrationMode);
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

      <Card>
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
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '저장 중...' : '저장'}
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
