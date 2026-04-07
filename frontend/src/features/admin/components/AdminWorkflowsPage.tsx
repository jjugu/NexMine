import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Typography, Button, Paper, Skeleton, Alert,
  FormControl, InputLabel, Select, MenuItem, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';
import axiosInstance from '../../../api/axiosInstance';
import type { WorkflowTransitionDto } from '../../../api/generated/model';

interface Role {
  id: number;
  name: string;
}

interface Tracker {
  id: number;
  name: string;
}

interface IssueStatus {
  id: number;
  name: string;
  isClosed: boolean;
}

export default function AdminWorkflowsPage() {
  const [roleId, setRoleId] = useState<number | ''>('');
  const [trackerId, setTrackerId] = useState<number | ''>('');
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch reference data
  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => axiosInstance.get<Role[]>('/admin/roles').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const trackersQuery = useQuery({
    queryKey: ['admin-trackers'],
    queryFn: () => axiosInstance.get<Tracker[]>('/admin/trackers').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const statusesQuery = useQuery({
    queryKey: ['admin-statuses'],
    queryFn: () => axiosInstance.get<IssueStatus[]>('/admin/issue-statuses').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const roles = rolesQuery.data ?? [];
  const trackers = trackersQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];

  // Fetch workflow transitions for selected role + tracker
  const transitionsQuery = useQuery({
    queryKey: ['admin', 'workflows', roleId, trackerId],
    queryFn: () =>
      axiosInstance
        .get<WorkflowTransitionDto[]>('/admin/workflows', { params: { roleId, trackerId } })
        .then((r) => r.data),
    enabled: !!roleId && !!trackerId,
  });

  // Build matrix from fetched transitions
  useMemo(() => {
    const transitions = transitionsQuery.data;
    if (!transitions || !statuses.length) return;
    const newMatrix: Record<string, boolean> = {};
    for (const t of transitions) {
      const key = `${t.oldStatusId}-${t.newStatusId}`;
      newMatrix[key] = true;
    }
    setMatrix(newMatrix);
  }, [transitionsQuery.data, statuses]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const transitions = Object.entries(matrix)
        .filter(([, checked]) => checked)
        .map(([key]) => {
          const [oldStatusId, newStatusId] = key.split('-').map(Number);
          return { oldStatusId, newStatusId };
        });
      return axiosInstance.put('/admin/workflows', {
        roleId,
        trackerId,
        transitions,
      });
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: '워크플로우가 저장되었습니다.', severity: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSnackbar({ open: true, message: msg ?? '워크플로우 저장에 실패했습니다.', severity: 'error' });
    },
  });

  function handleToggle(oldStatusId: number, newStatusId: number) {
    const key = `${oldStatusId}-${newStatusId}`;
    setMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    saveMutation.mutate();
  }

  const isLoading = rolesQuery.isLoading || trackersQuery.isLoading || statusesQuery.isLoading;
  const isError = rolesQuery.isError || trackersQuery.isError || statusesQuery.isError;
  const isMatrixReady = !!roleId && !!trackerId && statuses.length > 0;

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">데이터를 불러오는 데 실패했습니다.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountTreeIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>워크플로우</Typography>
      </Box>

      {/* Role and Tracker selectors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>역할</InputLabel>
          <Select
            value={roleId}
            label="역할"
            onChange={(e) => setRoleId(e.target.value as number)}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>트래커</InputLabel>
          <Select
            value={trackerId}
            label="트래커"
            onChange={(e) => setTrackerId(e.target.value as number)}
          >
            {trackers.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Matrix table */}
      {!isMatrixReady ? (
        <Alert severity="info">역할과 트래커를 선택하면 상태 전이 매트릭스가 표시됩니다.</Alert>
      ) : transitionsQuery.isLoading ? (
        <Skeleton variant="rectangular" height={300} />
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                      minWidth: 120,
                    }}
                  >
                    현재 상태 \ 목표 상태
                  </TableCell>
                  {statuses.map((col) => (
                    <TableCell key={col.id} align="center" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {col.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.name}
                    </TableCell>
                    {statuses.map((col) => {
                      const isSame = row.id === col.id;
                      const key = `${row.id}-${col.id}`;
                      return (
                        <TableCell key={col.id} align="center" sx={{ p: 0.5 }}>
                          {isSame ? (
                            <Checkbox disabled checked sx={{ opacity: 0.3 }} />
                          ) : (
                            <Checkbox
                              checked={!!matrix[key]}
                              onChange={() => handleToggle(row.id, col.id)}
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            저장
          </Button>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
