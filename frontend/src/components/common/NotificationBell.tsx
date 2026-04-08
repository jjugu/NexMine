import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItemButton,
  ListItemText, ListItemIcon, Divider, Button, CircularProgress,
  Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axiosInstance from '../../api/axiosInstance';
import type { NotificationListDto } from '../../api/generated/model';
import { useSignalR } from '../../hooks/useSignalR';

function getNotificationIcon(type: string | null | undefined) {
  switch (type) {
    case 'issue_assigned':
      return <AssignmentIndIcon fontSize="small" color="primary" />;
    case 'issue_updated':
      return <EditNoteIcon fontSize="small" color="action" />;
    case 'mentioned':
      return <AlternateEmailIcon fontSize="small" color="secondary" />;
    case 'watched':
      return <VisibilityIcon fontSize="small" color="info" />;
    default:
      return <NotificationsNoneIcon fontSize="small" />;
  }
}

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { on } = useSignalR();

  // Poll unread count every 30 seconds
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () =>
      axiosInstance
        .get<{ count: number }>('/my/notifications/unread-count')
        .then((r) => r.data),
    refetchInterval: 30000,
  });

  // Fetch notifications when popover opens
  const notificationsQuery = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () =>
      axiosInstance
        .get<NotificationListDto>('/my/notifications', { params: { page: 1, pageSize: 20 } })
        .then((r) => r.data),
    enabled: Boolean(anchorEl),
  });

  // Invalidate on SignalR personal notification
  on('PersonalNotification', () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    if (anchorEl) {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      axiosInstance.put(`/my/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put('/my/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const unreadCount = unreadQuery.data?.count ?? 0;
  const notifications = notificationsQuery.data?.items ?? [];
  const isOpen = Boolean(anchorEl);

  function handleOpen(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleNotificationClick(notification: (typeof notifications)[number]) {
    if (!notification.isRead && notification.id) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
    handleClose();
  }

  function handleMarkAllRead() {
    markAllReadMutation.mutate();
  }

  return (
    <>
      <Tooltip title="알림">
        <IconButton onClick={handleOpen} sx={{ mr: 0.5 }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 380, maxHeight: 480 },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            알림
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              모두 읽음
            </Button>
          )}
        </Box>
        <Divider />

        {notificationsQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              알림이 없습니다
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflow: 'auto', maxHeight: 380 }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  borderLeft: notification.isRead ? 'none' : '3px solid',
                  borderColor: 'primary.main',
                  py: 1.5,
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ maxWidth: '60%' }} noWrap>
                        {notification.actorName ?? ''}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.disabled">
                        {formatTimeAgo(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { fontWeight: notification.isRead ? 400 : 600 },
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
