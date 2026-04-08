import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link as MuiLink, Alert, CircularProgress, Grid,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import { useAuthStore } from '../../../stores/authStore';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, '아이디는 3자 이상이어야 합니다')
      .max(50, '아이디는 50자 이하여야 합니다'),
    email: z.string().email('올바른 이메일 주소를 입력해주세요'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const { data: registrationMode, isLoading: isModeLoading } = useQuery({
    queryKey: ['registration-mode'],
    queryFn: () =>
      axiosInstance
        .get<{ mode: string }>('/settings/registration-mode')
        .then((res) => res.data.mode),
    staleTime: 5 * 60 * 1000,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  function handleRegister(data: RegisterFormData) {
    setServerError(null);
    setIsSubmitting(true);

    const { confirmPassword: _, ...payload } = data;
    void _;

    axiosInstance
      .post('/Auth/register', payload)
      .then((res) => {
        const { accessToken, user, requiresApproval } = res.data;
        if (requiresApproval) {
          setRegistrationComplete(true);
        } else {
          setAuth(user, accessToken);
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          '회원가입에 실패했습니다. 입력 정보를 확인해주세요.';
        setServerError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  if (isModeLoading) {
    return (
      <Card>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (registrationMode === 'disabled') {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>회원가입</Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            회원가입이 비활성화되어 있습니다. 관리자에게 문의해주세요.
          </Alert>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/login">로그인 페이지로 이동</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (registrationComplete) {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>회원가입</Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.
          </Alert>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/login">로그인 페이지로 이동</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>회원가입</Typography>
        {registrationMode === 'approval' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            가입 후 관리자 승인이 필요합니다.
          </Alert>
        )}
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>
        )}
        <Box
          component="form"
          onSubmit={handleSubmit(handleRegister)}
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
            label="이메일"
            type="email"
            fullWidth
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="성"
                fullWidth
                autoComplete="family-name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                {...register('lastName')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="이름"
                fullWidth
                autoComplete="given-name"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                {...register('firstName')}
              />
            </Grid>
          </Grid>
          <TextField
            label="비밀번호"
            type="password"
            fullWidth
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <TextField
            label="비밀번호 확인"
            type="password"
            fullWidth
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {isSubmitting ? '가입 중...' : '가입하기'}
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            이미 계정이 있으신가요?{' '}
            <MuiLink component={Link} to="/login">로그인</MuiLink>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
