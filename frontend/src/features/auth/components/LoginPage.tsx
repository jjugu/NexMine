import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link as MuiLink, Alert, CircularProgress,
} from '@mui/material';
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
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            계정이 없으신가요?{' '}
            <MuiLink component={Link} to="/register">회원가입</MuiLink>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
