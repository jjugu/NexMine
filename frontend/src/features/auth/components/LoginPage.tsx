import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link as MuiLink, Alert, CircularProgress, Divider,
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
      .post('/Auth/login', data, { withCredentials: true })
      .then((res) => {
        const { accessToken, user } = res.data;
        setAuth(user, accessToken);
        navigate('/dashboard', { replace: true });
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

  return (
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
  );
}
