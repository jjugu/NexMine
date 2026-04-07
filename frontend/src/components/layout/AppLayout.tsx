import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  useMediaQuery, useTheme, Menu, MenuItem, Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../api/axiosInstance';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
  { label: '프로젝트', icon: <FolderIcon />, path: '/projects' },
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  function handleMenuOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleLogout() {
    handleMenuClose();
    axiosInstance.post('/Auth/logout').catch(() => {
      // ignore logout errors
    }).finally(() => {
      clearAuth();
      navigate('/login', { replace: true });
    });
  }

  const displayName =
    user?.firstName || user?.lastName
      ? `${user.lastName ?? ''}${user.firstName ?? ''}`.trim()
      : user?.username ?? '';

  const avatarLetter = (user?.username ?? '?')[0].toUpperCase();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Nexmine
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {displayName}
            </Typography>
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                {avatarLetter}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.email ?? ''}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                로그아웃
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
