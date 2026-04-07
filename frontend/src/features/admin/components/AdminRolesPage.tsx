import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Skeleton, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, IconButton, Tooltip,
  Checkbox, FormControlLabel, FormGroup, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import axiosInstance from '../../../api/axiosInstance';

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { key: 'manage_project', label: '프로젝트 관리' },
  { key: 'manage_members', label: '멤버 관리' },
  { key: 'manage_versions', label: '버전 관리' },
  { key: 'manage_categories', label: '카테고리 관리' },
  { key: 'manage_wiki', label: '위키 관리' },
  { key: 'manage_documents', label: '문서 관리' },
  { key: 'view_issues', label: '이슈 보기' },
  { key: 'add_issues', label: '이슈 추가' },
  { key: 'edit_issues', label: '이슈 편집' },
  { key: 'delete_issues', label: '이슈 삭제' },
  { key: 'add_comments', label: '댓글 추가' },
  { key: 'log_time', label: '시간 기록' },
];

export default function AdminRolesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => axiosInstance.get<Role[]>('/admin/roles').then((res) => res.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) =>
      editRole
        ? axiosInstance.put(`/admin/roles/${editRole.id}`, data)
        : axiosInstance.post('/admin/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '역할 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '역할 삭제에 실패했습니다. 참조 중인 프로젝트가 있을 수 있습니다.');
      setDeleteConfirm(null);
    },
  });

  const openCreate = () => {
    setEditRole(null);
    setFormName('');
    setFormPermissions([]);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setFormName(role.name);
    setFormPermissions(role.permissions ?? []);
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditRole(null);
    setFormError('');
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
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
        <Alert severity="error">역할 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  const roleList = roles ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">역할 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          역할 추가
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        renderSkeleton()
      ) : roleList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 역할이 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 역할 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {roleList.map((role) => (
            <Card key={role.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2">{role.name}</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(role)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(role)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {(role.permissions ?? []).map((p) => (
                    <Chip key={p} label={AVAILABLE_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p} size="small" variant="outlined" />
                  ))}
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
                <TableCell>역할명</TableCell>
                <TableCell>권한</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roleList.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(role.permissions ?? []).map((p) => (
                        <Chip key={p} label={AVAILABLE_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(role)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(role)}>
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
        <DialogTitle>{editRole ? '역할 수정' : '역할 추가'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="역할명"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <Typography variant="subtitle2">권한</Typography>
            <FormGroup>
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <FormControlLabel
                  key={perm.key}
                  control={
                    <Checkbox
                      checked={formPermissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      size="small"
                    />
                  }
                  label={perm.label}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!formName || saveMutation.isPending}
            onClick={() => saveMutation.mutate({ name: formName, permissions: formPermissions })}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>역할 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 역할을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 역할을 사용하는 프로젝트 멤버가 있으면 삭제할 수 없습니다.
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
