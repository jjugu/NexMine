import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Box } from '@mui/material';
import { useSignalR } from '../../hooks/useSignalR';
import { useAuthStore } from '../../stores/authStore';

interface IssueNotification {
  projectIdentifier: string;
  issueId: number;
  subject: string;
  userName: string;
  notes?: string;
}

interface PersonalNotification {
  eventType: string;
  message: string;
  projectIdentifier?: string;
  issueId?: number;
}

interface ToastItem {
  id: number;
  message: string;
  navigateTo: string;
}

const MAX_TOASTS = 3;
const AUTO_HIDE_MS = 5000;

let toastIdCounter = 0;

/**
 * Global realtime notification component.
 * Mount once inside AppLayout to receive SignalR project-level events
 * and display toast notifications.
 */
export default function RealtimeNotifications() {
  const { isConnected, on, invoke } = useSignalR();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const currentProjectRef = useRef<string | null>(null);

  // Extract project identifier from the current URL
  const getProjectIdentifier = useCallback((): string | null => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Add a toast (max 3 stacked)
  const addToast = useCallback((message: string, navigateTo: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => {
      const updated = [...prev, { id, message, navigateTo }];
      // Keep only the last MAX_TOASTS
      return updated.slice(-MAX_TOASTS);
    });

    // Auto-remove after timeout
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_HIDE_MS);
  }, []);

  // Join/Leave project groups when the URL changes
  useEffect(() => {
    if (!isConnected) return;

    const newProject = getProjectIdentifier();
    const prevProject = currentProjectRef.current;

    if (prevProject && prevProject !== newProject) {
      invoke('LeaveProject', prevProject);
    }
    if (newProject && newProject !== prevProject) {
      invoke('JoinProject', newProject);
    }
    currentProjectRef.current = newProject;

    return () => {
      // Leave on unmount
      if (currentProjectRef.current) {
        invoke('LeaveProject', currentProjectRef.current);
        currentProjectRef.current = null;
      }
    };
  }, [isConnected, location.pathname, getProjectIdentifier, invoke]);

  // Subscribe to server events
  useEffect(() => {
    if (!isConnected) return;

    const currentUser = user?.username;

    const unsubCreated = on('IssueCreated', (...args: unknown[]) => {
      const data = args[0] as IssueNotification;
      if (data.userName === currentUser) return;
      addToast(
        `${data.userName}님이 새 이슈 '#${data.issueId} ${data.subject}'을 생성했습니다`,
        `/projects/${data.projectIdentifier}/issues/${data.issueId}`,
      );
    });

    const unsubUpdated = on('IssueUpdated', (...args: unknown[]) => {
      const data = args[0] as IssueNotification;
      if (data.userName === currentUser) return;
      addToast(
        `${data.userName}님이 이슈 '#${data.issueId} ${data.subject}'을 수정했습니다`,
        `/projects/${data.projectIdentifier}/issues/${data.issueId}`,
      );
    });

    const unsubCommented = on('IssueCommented', (...args: unknown[]) => {
      const data = args[0] as IssueNotification;
      if (data.userName === currentUser) return;
      addToast(
        `${data.userName}님이 이슈 '#${data.issueId}'에 댓글을 남겼습니다`,
        `/projects/${data.projectIdentifier}/issues/${data.issueId}`,
      );
    });

    // Personal notifications (works on any page)
    const unsubPersonal = on('PersonalNotification', (...args: unknown[]) => {
      const data = args[0] as PersonalNotification;
      const navigateTo = data.projectIdentifier && data.issueId
        ? `/projects/${data.projectIdentifier}/issues/${data.issueId}`
        : '/dashboard';
      addToast(data.message, navigateTo);
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCommented();
      unsubPersonal();
    };
  }, [isConnected, on, user?.username, addToast]);

  function handleToastClick(toast: ToastItem) {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    navigate(toast.navigateTo);
  }

  function handleToastClose(toastId: number) {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }

  return (
    <Box>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            top: `${(index * 64) + 72}px !important`,
          }}
        >
          <Alert
            severity="info"
            variant="filled"
            onClose={() => handleToastClose(toast.id)}
            sx={{ cursor: 'pointer', minWidth: 300 }}
            onClick={() => handleToastClick(toast)}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}
