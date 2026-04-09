import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Skeleton, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, Alert, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axiosInstance from '../../../api/axiosInstance';

interface IssueStatus {
  id: number;
  name: string;
  position: number;
  isClosed: boolean;
}

export default function AdminStatusesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<IssueStatus | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<IssueStatus | null>(null);

  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState(0);
  const [formIsClosed, setFormIsClosed] = useState(false);

  const { data: statuses, isLoading, isError } = useQuery({
    queryKey: ['admin-statuses'],
    queryFn: () => axiosInstance.get<IssueStatus[]>('/admin/issue-statuses').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; position: number; isClosed: boolean }) =>
      editStatus
        ? axiosInstance.put(`/admin/issue-statuses/${editStatus.id}`, data)
        : axiosInstance.post('/admin/issue-statuses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['issue-statuses'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '상태 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/issue-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['issue-statuses'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '상태 삭제에 실패했습니다. 사용 중인 이슈가 있을 수 있습니다.');
      setDeleteConfirm(null);
    },
  });

  const sortedStatuses = [...(statuses ?? [])].sort((a, b) => a.position - b.position);

  const reorderMutation = useMutation({
    mutationFn: async (swaps: { id: number; position: number }[]) => {
      for (const s of swaps) {
        await axiosInstance.put(`/admin/issue-statuses/${s.id}`, { position: s.position });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['issue-statuses'] });
    },
  });

  const openCreate = () => {
    setEditStatus(null);
    setFormName('');
    setFormPosition(statuses ? statuses.length + 1 : 1);
    setFormIsClosed(false);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (status: IssueStatus) => {
    setEditStatus(status);
    setFormName(status.name);
    setFormPosition(status.position);
    setFormIsClosed(status.isClosed);
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditStatus(null);
    setFormError('');
  };

  const handleMoveUp = (status: IssueStatus, index: number) => {
    if (index === 0) return;
    const prev = sortedStatuses[index - 1];
    reorderMutation.mutate([
      { id: status.id, position: prev.position },
      { id: prev.id, position: status.position },
    ]);
  };

  const handleMoveDown = (status: IssueStatus, index: number) => {
    if (index >= sortedStatuses.length - 1) return;
    const next = sortedStatuses[index + 1];
    reorderMutation.mutate([
      { id: status.id, position: next.position },
      { id: next.id, position: status.position },
    ]);
  };

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" sx={{ mb: 1, height: 48, borderRadius: 1 }} />
      ))}
    </Box>
  );

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">상태 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">이슈 상태 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          상태 추가
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        renderSkeleton()
      ) : sortedStatuses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PlaylistAddCheckIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 상태가 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 상태 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedStatuses.map((status, index) => (
            <Card key={status.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {status.name}
                      {status.isClosed && (
                        <Chip label="종료" color="default" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      순서: {status.position}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(status, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedStatuses.length - 1} onClick={() => handleMoveDown(status, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(status)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(status)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell align="center">순서</TableCell>
                <TableCell align="center">종료 상태</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStatuses.map((status, index) => (
                <TableRow key={status.id} hover>
                  <TableCell>{status.name}</TableCell>
                  <TableCell align="center">{status.position}</TableCell>
                  <TableCell align="center">
                    {status.isClosed && <Chip label="종료" color="default" size="small" />}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(status, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedStatuses.length - 1} onClick={() => handleMoveDown(status, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(status)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(status)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editStatus ? '상태 수정' : '상태 추가'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="이름"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <TextField
              label="순서"
              type="number"
              value={formPosition}
              onChange={(e) => setFormPosition(parseInt(e.target.value, 10) || 0)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formIsClosed}
                  onChange={(e) => setFormIsClosed(e.target.checked)}
                />
              }
              label="종료 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!formName || saveMutation.isPending}
            onClick={() => saveMutation.mutate({ name: formName, position: formPosition, isClosed: formIsClosed })}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>상태 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 상태를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 상태를 사용하는 이슈가 있으면 삭제할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
