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
import LabelIcon from '@mui/icons-material/Label';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axiosInstance from '../../../api/axiosInstance';

interface Tracker {
  id: number;
  name: string;
  position: number;
  isDefault: boolean;
}

export default function AdminTrackersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTracker, setEditTracker] = useState<Tracker | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Tracker | null>(null);

  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState(0);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const { data: trackers, isLoading, isError } = useQuery({
    queryKey: ['admin-trackers'],
    queryFn: () => axiosInstance.get<Tracker[]>('/admin/trackers').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; position: number; isDefault: boolean }) =>
      editTracker
        ? axiosInstance.put(`/admin/trackers/${editTracker.id}`, data)
        : axiosInstance.post('/admin/trackers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trackers'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '트래커 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/trackers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trackers'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '트래커 삭제에 실패했습니다. 사용 중인 이슈가 있을 수 있습니다.');
      setDeleteConfirm(null);
    },
  });

  const sortedTrackers = [...(trackers ?? [])].sort((a, b) => a.position - b.position);

  const reorderMutation = useMutation({
    mutationFn: async (swaps: { id: number; position: number }[]) => {
      for (const s of swaps) {
        await axiosInstance.put(`/admin/trackers/${s.id}`, { position: s.position });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trackers'] });
    },
  });

  const openCreate = () => {
    setEditTracker(null);
    setFormName('');
    setFormPosition(trackers ? trackers.length + 1 : 1);
    setFormIsDefault(false);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (tracker: Tracker) => {
    setEditTracker(tracker);
    setFormName(tracker.name);
    setFormPosition(tracker.position);
    setFormIsDefault(tracker.isDefault);
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTracker(null);
    setFormError('');
  };

  const handleMoveUp = (tracker: Tracker, index: number) => {
    if (index === 0) return;
    const prev = sortedTrackers[index - 1];
    reorderMutation.mutate([
      { id: tracker.id, position: prev.position },
      { id: prev.id, position: tracker.position },
    ]);
  };

  const handleMoveDown = (tracker: Tracker, index: number) => {
    if (index >= sortedTrackers.length - 1) return;
    const next = sortedTrackers[index + 1];
    reorderMutation.mutate([
      { id: tracker.id, position: next.position },
      { id: next.id, position: tracker.position },
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
        <Alert severity="error">트래커 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">트래커 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          트래커 추가
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        renderSkeleton()
      ) : sortedTrackers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LabelIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 트래커가 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 트래커 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedTrackers.map((tracker, index) => (
            <Card key={tracker.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {tracker.name}
                      {tracker.isDefault && (
                        <Chip label="기본" color="primary" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      순서: {tracker.position}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(tracker, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedTrackers.length - 1} onClick={() => handleMoveDown(tracker, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(tracker)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(tracker)}>
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
                <TableCell align="center">기본값</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTrackers.map((tracker, index) => (
                <TableRow key={tracker.id} hover>
                  <TableCell>{tracker.name}</TableCell>
                  <TableCell align="center">{tracker.position}</TableCell>
                  <TableCell align="center">
                    {tracker.isDefault && <Chip label="기본" color="primary" size="small" />}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(tracker, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedTrackers.length - 1} onClick={() => handleMoveDown(tracker, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(tracker)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(tracker)}>
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
        <DialogTitle>{editTracker ? '트래커 수정' : '트래커 추가'}</DialogTitle>
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
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                />
              }
              label="기본 트래커"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!formName || saveMutation.isPending}
            onClick={() => saveMutation.mutate({ name: formName, position: formPosition, isDefault: formIsDefault })}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>트래커 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 트래커를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 트래커를 사용하는 이슈가 있으면 삭제할 수 없습니다.
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
