import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Skeleton, TablePagination, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Switch, FormControlLabel, Alert, IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import axiosInstance from '../../../api/axiosInstance';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AdminUsersResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

interface UserEditData {
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isActive: boolean;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function AdminUsersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);
  const searchFromUrl = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState('');

  // Create form
  const [createForm, setCreateForm] = useState<UserFormData>({
    username: '', email: '', password: '', firstName: '', lastName: '', isAdmin: false,
  });

  // Edit form
  const [editForm, setEditForm] = useState<UserEditData>({
    email: '', firstName: '', lastName: '', isAdmin: false, isActive: true,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchInput) {
        newParams.set('search', searchInput);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1');
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', { page, pageSize, search: searchFromUrl }],
    queryFn: () =>
      axiosInstance
        .get<AdminUsersResponse>('/admin/users', {
          params: { page, pageSize, search: searchFromUrl || undefined },
        })
        .then((res) => res.data),
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const createMutation = useMutation({
    mutationFn: (form: UserFormData) =>
      axiosInstance.post('/admin/users', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateOpen(false);
      setCreateForm({ username: '', email: '', password: '', firstName: '', lastName: '', isAdmin: false });
      setFormError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '사용자 생성에 실패했습니다.');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data: editData }: { id: number; data: UserEditData }) =>
      axiosInstance.put(`/admin/users/${id}`, editData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
      setFormError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '사용자 수정에 실패했습니다.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      axiosInstance.put(`/admin/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(newPage + 1));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('pageSize', event.target.value);
      newParams.set('page', '1');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({
      email: user.email ?? '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    });
    setFormError('');
  };

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" sx={{ mb: 1, height: 48, borderRadius: 1 }} />
      ))}
    </Box>
  );

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">사용자 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">사용자 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreateOpen(true); setFormError(''); }}>
          사용자 추가
        </Button>
      </Box>

      <TextField
        placeholder="사용자 검색..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
      />

      {isLoading ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {searchFromUrl ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
          </Typography>
        </Paper>
      ) : isMobile ? (
        /* Mobile card view */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((user) => (
            <Card key={user.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2">{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.lastName ?? ''}{user.firstName ?? ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {user.isAdmin && <Chip label="관리자" color="primary" size="small" />}
                    <Chip
                      label={user.isActive ? '활성' : '비활성'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    생성: {formatDate(user.createdAt)}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title={user.isActive ? '비활성화' : '활성화'}>
                      <IconButton
                        size="small"
                        onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        /* Desktop table view */
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>사용자명</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>이름</TableCell>
                <TableCell align="center">관리자</TableCell>
                <TableCell align="center">상태</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.lastName ?? ''}{user.firstName ?? ''}</TableCell>
                  <TableCell align="center">
                    {user.isAdmin && <Chip label="관리자" color="primary" size="small" />}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.isActive ? '활성' : '비활성'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title={user.isActive ? '비활성화' : '활성화'}>
                      <IconButton
                        size="small"
                        onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="페이지당 행 수"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `${to} 이상`}`}
      />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>사용자 추가</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="사용자명"
              required
              value={createForm.username}
              onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
            />
            <TextField
              label="이메일"
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="비밀번호"
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="성"
                fullWidth
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
              />
              <TextField
                label="이름"
                fullWidth
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={createForm.isAdmin}
                  onChange={(e) => setCreateForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                />
              }
              label="관리자 권한"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!createForm.username || !createForm.email || !createForm.password || createMutation.isPending}
            onClick={() => createMutation.mutate(createForm)}
          >
            {createMutation.isPending ? '생성 중...' : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>사용자 수정 - {editUser?.username}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="이메일"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="성"
                fullWidth
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
              />
              <TextField
                label="이름"
                fullWidth
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isAdmin}
                  onChange={(e) => setEditForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                />
              }
              label="관리자 권한"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="활성 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>취소</Button>
          <Button
            variant="contained"
            disabled={editMutation.isPending}
            onClick={() => editUser && editMutation.mutate({ id: editUser.id, data: editForm })}
          >
            {editMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
