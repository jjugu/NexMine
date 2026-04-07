import { useState } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  useMediaQuery, useTheme, Menu, MenuItem, Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import LogoutIcon from '@mui/icons-material/Logout';
import BugReportIcon from '@mui/icons-material/BugReport';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../api/axiosInstance';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
  { label: '프로젝트', icon: <FolderIcon />, path: '/projects' },
];

interface ProjectSubNavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  isDisabled?: boolean;
}

function getProjectSubNav(identifier: string): ProjectSubNavItem[] {
  return [
    { label: '이슈', icon: <BugReportIcon />, path: `/projects/${identifier}/issues` },
    { label: '칸반', icon: <ViewKanbanIcon />, path: `/projects/${identifier}/kanban` },
    { label: '간트', icon: <BarChartIcon />, path: `/projects/${identifier}/gantt` },
    { label: '캘린더', icon: <CalendarMonthIcon />, path: `/projects/${identifier}/calendar` },
    { label: '위키', icon: <ArticleIcon />, path: `/projects/${identifier}/wiki`, isDisabled: true },
    { label: '문서', icon: <DescriptionIcon />, path: `/projects/${identifier}/documents`, isDisabled: true },
    { label: '버전', icon: <NewReleasesIcon />, path: `/projects/${identifier}/versions` },
    { label: '설정', icon: <SettingsIcon />, path: `/projects/${identifier}/settings` },
  ];
}

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ identifier?: string }>();
  const { user, clearAuth } = useAuthStore();

  // Detect if we are inside a project context
  const isProjectContext = location.pathname.match(/^\/projects\/[^/]+\/.+/);
  const projectIdentifier = isProjectContext ? params.identifier ?? location.pathname.split('/')[2] : null;
  const projectSubNav = projectIdentifier ? getProjectSubNav(projectIdentifier) : [];

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
            selected={location.pathname === item.path}
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

        {/* Project sub-navigation */}
        {projectIdentifier && projectSubNav.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              onClick={() => {
                navigate(`/projects/${projectIdentifier}`);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ArrowBackIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={projectIdentifier}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
              />
            </ListItemButton>
            {projectSubNav.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname.startsWith(item.path)}
                disabled={item.isDisabled}
                onClick={() => {
                  if (!item.isDisabled) {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }
                }}
                sx={{ borderRadius: 1, mb: 0.5, pl: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </>
        )}
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
