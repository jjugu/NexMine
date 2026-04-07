import { Outlet } from 'react-router-dom';
import { Box, Alert, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '../../stores/authStore';

export default function AdminRoute() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user?.isAdmin) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <LockIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">권한이 없습니다</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            이 페이지는 관리자만 접근할 수 있습니다.
          </Typography>
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          대시보드로 이동
        </Button>
      </Box>
    );
  }

  return <Outlet />;
}
