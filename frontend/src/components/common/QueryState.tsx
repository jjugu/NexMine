import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  errorMessage = '데이터를 불러오는데 실패했습니다.',
  skeleton,
  emptyState,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <>{skeleton ?? <TableSkeleton />}</>;
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        sx={{ mt: 2 }}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              재시도
            </Button>
          )
        }
      >
        {errorMessage}
      </Alert>
    );
  }

  if (isEmpty) {
    return <>{emptyState ?? <DefaultEmptyState />}</>;
  }

  return <>{children}</>;
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, px: 2, py: 1 }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={24} />
        ))}
      </Box>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={52}
          sx={{ borderRadius: 1 }}
          animation="wave"
        />
      ))}
    </Box>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...Array(count)].map((_, i) => (
        <Box key={i} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Skeleton variant="text" width="60%" height={28} animation="wave" />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Skeleton variant="rounded" width={60} height={24} animation="wave" />
            <Skeleton variant="rounded" width={80} height={24} animation="wave" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function KanbanSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2 }}>
      {[...Array(columns)].map((_, col) => (
        <Box
          key={col}
          sx={{
            minWidth: 280,
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Skeleton variant="text" width="70%" height={32} animation="wave" />
          {[...Array(col === 0 ? 3 : 2)].map((_, card) => (
            <Box
              key={card}
              sx={{
                p: 1.5,
                mt: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Skeleton variant="text" width="80%" height={22} animation="wave" />
              <Skeleton variant="text" width="50%" height={18} animation="wave" />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function DashboardSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Box key={i} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Skeleton variant="text" width="40%" height={28} animation="wave" />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 1, borderRadius: 1 }} animation="wave" />
        </Box>
      ))}
    </Box>
  );
}

function DefaultEmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        데이터가 없습니다
      </Typography>
    </Box>
  );
}
