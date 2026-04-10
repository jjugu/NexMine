import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link as MuiLink, Alert, CircularProgress, Divider,
  FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import axiosInstance from '../../../api/axiosInstance';
import { useAuthStore } from '../../../stores/authStore';

const loginSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<{ username: string; password: string } | null>(null);

  const { data: registrationMode } = useQuery({
    queryKey: ['registration-mode'],
    queryFn: () =>
      axiosInstance
        .get<{ mode: string }>('/settings/registration-mode')
        .then((res) => res.data.mode),
    staleTime: 5 * 60 * 1000,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  function handleLogin(data: LoginFormData) {
    setServerError(null);
    setIsSubmitting(true);

    axiosInstance
      .post('/Auth/login', { ...data, rememberMe }, { withCredentials: true })
      .then((res) => {
        const { accessToken, user, mustChangePassword } = res.data;
        setAuth(user, accessToken);
        if (mustChangePassword) {
          setSavedCredentials({ username: data.username, password: data.password });
          setShowChangePassword(true);
        } else {
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
        setServerError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  function handleGoogleLoginSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      setServerError('Google 인증 정보를 받지 못했습니다.');
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    axiosInstance
      .post('/Auth/google', { idToken: credentialResponse.credential }, { withCredentials: true })
      .then((res) => {
        const { accessToken, user } = res.data;
        setAuth(user, accessToken);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          'Google 로그인에 실패했습니다.';
        setServerError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  function handleChangePassword() {
    setChangePasswordError(null);
    if (newPassword.length < 8) {
      setChangePasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!savedCredentials) return;

    setIsChangingPassword(true);
    axiosInstance
      .put('/Auth/change-password', {
        currentPassword: savedCredentials.password,
        newPassword,
      })
      .then(() => {
        setShowChangePassword(false);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        setChangePasswordError(
          err.response?.data?.detail || '비밀번호 변경에 실패했습니다.',
        );
      })
      .finally(() => {
        setIsChangingPassword(false);
      });
  }

  return (
    <>
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>로그인</Typography>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit(handleLogin)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="아이디"
            fullWidth
            autoComplete="username"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message}
            {...register('username')}
          />
          <TextField
            label="비밀번호"
            type="password"
            fullWidth
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                size="small"
              />
            }
            label="로그인 유지"
            sx={{ mt: -1 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
          {registrationMode !== 'disabled' && (
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              계정이 없으신가요?{' '}
              <MuiLink component={Link} to="/register">
                {registrationMode === 'approval' ? '회원가입 (관리자 승인 필요)' : '회원가입'}
              </MuiLink>
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 2 }}>또는</Divider>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              setServerError('Google 로그인에 실패했습니다.');
            }}
            text="signin_with"
            width={320}
          />
        </Box>
      </CardContent>
    </Card>

    <Dialog open={showChangePassword} maxWidth="xs" fullWidth>
      <DialogTitle>비밀번호 변경 필요</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          보안을 위해 기본 비밀번호를 변경해주세요.
        </Typography>
        {changePasswordError && (
          <Alert severity="error" sx={{ mb: 2 }}>{changePasswordError}</Alert>
        )}
        <TextField
          label="새 비밀번호"
          type="password"
          fullWidth
          autoFocus
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
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
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={isChangingPassword}
          startIcon={isChangingPassword ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
