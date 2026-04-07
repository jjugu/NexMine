import { Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: 'primary.main' }}>
        Nexmine
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
