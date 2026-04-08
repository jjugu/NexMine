import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  useMediaQuery, useTheme, Menu, MenuItem, Avatar,
  TextField, InputAdornment, LinearProgress, Tooltip,
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
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import LabelIcon from '@mui/icons-material/Label';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import TuneIcon from '@mui/icons-material/Tune';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useIsFetching } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import axiosInstance from '../../api/axiosInstance';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 56;

const navItems = [
  { label: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
  { label: '프로젝트', icon: <FolderIcon />, path: '/projects' },
  { label: '활동', icon: <HistoryIcon />, path: '/activity' },
  { label: '시간 보고서', icon: <AssessmentIcon />, path: '/reports/time' },
];

const adminNavItems = [
  { label: '사용자 관리', icon: <PeopleIcon />, path: '/admin/users' },
  { label: '역할', icon: <SecurityIcon />, path: '/admin/roles' },
  { label: '트래커', icon: <LabelIcon />, path: '/admin/trackers' },
  { label: '상태', icon: <PlaylistAddCheckIcon />, path: '/admin/statuses' },
  { label: '우선순위', icon: <PriorityHighIcon />, path: '/admin/priorities' },
  { label: '커스텀 필드', icon: <TuneIcon />, path: '/admin/custom-fields' },
  { label: '워크플로우', icon: <AccountTreeIcon />, path: '/admin/workflows' },
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
    { label: '위키', icon: <ArticleIcon />, path: `/projects/${identifier}/wiki` },
    { label: '문서', icon: <DescriptionIcon />, path: `/projects/${identifier}/documents` },
    { label: '로드맵', icon: <FlagIcon />, path: `/projects/${identifier}/roadmap` },
    { label: '활동', icon: <HistoryIcon />, path: `/projects/${identifier}/activity` },
    { label: '버전', icon: <NewReleasesIcon />, path: `/projects/${identifier}/versions` },
    { label: '설정', icon: <SettingsIcon />, path: `/projects/${identifier}/settings` },
  ];
}

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ identifier?: string }>();
  const { user, clearAuth } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const isFetching = useIsFetching();

  // Detect if we are inside a project context (/projects/{identifier} and deeper)
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const isProjectContext = projectMatch && projectMatch[1] !== 'undefined';
  const projectIdentifier = isProjectContext ? params.identifier ?? projectMatch[1] : null;
  const projectSubNav = projectIdentifier ? getProjectSubNav(projectIdentifier) : [];

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        if (isSmall) {
          setSearchExpanded(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
          searchInputRef.current?.focus();
        }
      }
      if (e.key === 'Escape') {
        if (searchExpanded) {
          setSearchExpanded(false);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchExpanded, isSmall]);

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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchExpanded(false);
    }
  }

  const displayName =
    user?.firstName || user?.lastName
      ? `${user.lastName ?? ''}${user.firstName ?? ''}`.trim()
      : user?.username ?? '';

  const avatarLetter = (user?.username ?? '?')[0].toUpperCase();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ justifyContent: sidebarOpen ? 'space-between' : 'center', px: sidebarOpen ? 2 : 0.5, minHeight: 48 }}>
        {sidebarOpen ? (
          <>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }}
              onClick={() => {
                navigate('/dashboard');
                if (isMobile) setMobileOpen(false);
              }}
            >
              Nexmine
            </Typography>
            {!isMobile && (
              <IconButton size="small" onClick={() => setSidebarOpen(false)}>
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            )}
          </>
        ) : (
          <Tooltip title="사이드바 펼치기" placement="right">
            <IconButton size="small" onClick={() => setSidebarOpen(true)}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: sidebarOpen ? 1 : 0.5, overflow: 'hidden' }}>
        {navItems.map((item) => (
          <Tooltip title={!sidebarOpen ? item.label : ''} placement="right" key={item.path}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1, mb: 0.5, justifyContent: sidebarOpen ? 'initial' : 'center', px: sidebarOpen ? 2 : 1 }}
            >
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 36 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        ))}

        {/* Project sub-navigation */}
        {projectIdentifier && projectSubNav.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Tooltip title={!sidebarOpen ? projectIdentifier ?? '' : ''} placement="right">
            <ListItemButton
              onClick={() => {
                navigate(`/projects/${projectIdentifier}`);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1, mb: 0.5, justifyContent: sidebarOpen ? 'initial' : 'center', px: sidebarOpen ? 2 : 1 }}
            >
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 36 : 'auto', justifyContent: 'center' }}>
                <ArrowBackIcon fontSize="small" />
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary={projectIdentifier}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                />
              )}
            </ListItemButton>
            </Tooltip>
            {projectSubNav.map((item) => (
              <Tooltip title={!sidebarOpen ? item.label : ''} placement="right" key={item.path}>
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                disabled={item.isDisabled}
                onClick={() => {
                  if (!item.isDisabled) {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }
                }}
                sx={{ borderRadius: 1, mb: 0.5, pl: sidebarOpen ? 2 : 1, justifyContent: sidebarOpen ? 'initial' : 'center', px: sidebarOpen ? 2 : 1 }}
              >
                <ListItemIcon sx={{ minWidth: sidebarOpen ? 36 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.label} />}
              </ListItemButton>
              </Tooltip>
            ))}
          </>
        )}

        {/* Admin section - only visible to admins */}
        {user?.isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            {sidebarOpen ? (
              <ListItemButton disabled sx={{ borderRadius: 1, mb: 0.5, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="관리자"
                  primaryTypographyProps={{ variant: 'caption', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}
                />
              </ListItemButton>
            ) : (
              <Divider sx={{ my: 0.5 }} />
            )}
            {adminNavItems.map((item) => (
              <Tooltip title={!sidebarOpen ? item.label : ''} placement="right" key={item.path}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ borderRadius: 1, mb: 0.5, pl: sidebarOpen ? 2 : 1, justifyContent: sidebarOpen ? 'initial' : 'center', px: sidebarOpen ? 2 : 1 }}
              >
                <ListItemIcon sx={{ minWidth: sidebarOpen ? 36 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.label} />}
              </ListItemButton>
              </Tooltip>
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
            width: sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowX: 'hidden',
              transition: 'width 0.2s ease',
            },
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
          {/* Global loading indicator */}
          {isFetching > 0 && (
            <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />
          )}
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Search - Desktop: always visible input; Mobile: expandable */}
            {isSmall ? (
              searchExpanded ? (
                <Box
                  component="form"
                  onSubmit={handleSearchSubmit}
                  sx={{ flex: 1, display: 'flex', alignItems: 'center', mr: 1 }}
                >
                  <TextField
                    inputRef={searchInputRef}
                    placeholder="검색..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    fullWidth
                    size="small"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchExpanded(false)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              ) : (
                <IconButton onClick={() => setSearchExpanded(true)} sx={{ mr: 0.5 }}>
                  <SearchIcon />
                </IconButton>
              )
            ) : (
              <Box
                component="form"
                onSubmit={handleSearchSubmit}
                sx={{ mr: 2 }}
              >
                <TextField
                  inputRef={searchInputRef}
                  placeholder="검색... (Ctrl+K)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  size="small"
                  sx={{ width: { sm: 200, md: 280 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {/* Dark mode toggle */}
            {!searchExpanded && (
              <Tooltip title={mode === 'light' ? '다크 모드' : '라이트 모드'}>
                <IconButton onClick={toggleMode} sx={{ mr: 0.5 }}>
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>
            )}

            {!searchExpanded && (
              <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                {displayName}
              </Typography>
            )}
            {!searchExpanded && (
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                  {avatarLetter}
                </Avatar>
              </IconButton>
            )}
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
