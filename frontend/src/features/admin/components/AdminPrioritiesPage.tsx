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
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axiosInstance from '../../../api/axiosInstance';

interface IssuePriority {
  id: number;
  name: string;
  position: number;
  isDefault: boolean;
}

export default function AdminPrioritiesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPriority, setEditPriority] = useState<IssuePriority | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<IssuePriority | null>(null);

  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState(0);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const { data: priorities, isLoading, isError } = useQuery({
    queryKey: ['admin-priorities'],
    queryFn: () => axiosInstance.get<IssuePriority[]>('/admin/issue-priorities').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; position: number; isDefault: boolean }) =>
      editPriority
        ? axiosInstance.put(`/admin/issue-priorities/${editPriority.id}`, data)
        : axiosInstance.post('/admin/issue-priorities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-priorities'] });
      queryClient.invalidateQueries({ queryKey: ['issue-priorities'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '우선순위 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/issue-priorities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-priorities'] });
      queryClient.invalidateQueries({ queryKey: ['issue-priorities'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '우선순위 삭제에 실패했습니다. 사용 중인 이슈가 있을 수 있습니다.');
      setDeleteConfirm(null);
    },
  });

  const sortedPriorities = [...(priorities ?? [])].sort((a, b) => a.position - b.position);

  const reorderMutation = useMutation({
    mutationFn: async (swaps: { id: number; position: number }[]) => {
      for (const s of swaps) {
        await axiosInstance.put(`/admin/issue-priorities/${s.id}`, { position: s.position });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-priorities'] });
      queryClient.invalidateQueries({ queryKey: ['issue-priorities'] });
    },
  });

  const openCreate = () => {
    setEditPriority(null);
    setFormName('');
    setFormPosition(priorities ? priorities.length + 1 : 1);
    setFormIsDefault(false);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (priority: IssuePriority) => {
    setEditPriority(priority);
    setFormName(priority.name);
    setFormPosition(priority.position);
    setFormIsDefault(priority.isDefault);
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditPriority(null);
    setFormError('');
  };

  const handleMoveUp = (priority: IssuePriority, index: number) => {
    if (index === 0) return;
    const prev = sortedPriorities[index - 1];
    reorderMutation.mutate([
      { id: priority.id, position: prev.position },
      { id: prev.id, position: priority.position },
    ]);
  };

  const handleMoveDown = (priority: IssuePriority, index: number) => {
    if (index >= sortedPriorities.length - 1) return;
    const next = sortedPriorities[index + 1];
    reorderMutation.mutate([
      { id: priority.id, position: next.position },
      { id: next.id, position: priority.position },
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
        <Alert severity="error">우선순위 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">우선순위 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          우선순위 추가
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        renderSkeleton()
      ) : sortedPriorities.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PriorityHighIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 우선순위가 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 우선순위 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedPriorities.map((priority, index) => (
            <Card key={priority.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {priority.name}
                      {priority.isDefault && (
                        <Chip label="기본" color="primary" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      순서: {priority.position}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(priority, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedPriorities.length - 1} onClick={() => handleMoveDown(priority, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(priority)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(priority)}>
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
              {sortedPriorities.map((priority, index) => (
                <TableRow key={priority.id} hover>
                  <TableCell>{priority.name}</TableCell>
                  <TableCell align="center">{priority.position}</TableCell>
                  <TableCell align="center">
                    {priority.isDefault && <Chip label="기본" color="primary" size="small" />}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" disabled={index === 0} onClick={() => handleMoveUp(priority, index)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={index === sortedPriorities.length - 1} onClick={() => handleMoveDown(priority, index)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(priority)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(priority)}>
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
        <DialogTitle>{editPriority ? '우선순위 수정' : '우선순위 추가'}</DialogTitle>
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
              label="기본 우선순위"
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
        <DialogTitle>우선순위 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 우선순위를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 우선순위를 사용하는 이슈가 있으면 삭제할 수 없습니다.
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
