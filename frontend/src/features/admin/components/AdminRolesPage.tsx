import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Skeleton, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, IconButton, Tooltip,
  Checkbox, FormControlLabel, Chip, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axiosInstance from '../../../api/axiosInstance';
import type { PermissionListResponse } from '../../../api/generated/model';

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

const PERMISSION_LABELS: Record<string, string> = {
  'project.view': '프로젝트 조회',
  'project.edit': '프로젝트 수정',
  'project.manage': '프로젝트 관리',
  'project.archive': '프로젝트 보관',
  'issue.view': '이슈 조회',
  'issue.create': '이슈 생성',
  'issue.edit': '이슈 수정',
  'issue.edit_own': '내 이슈 수정',
  'issue.delete': '이슈 삭제',
  'issue.comment': '이슈 댓글',
  'issue.assign': '이슈 할당',
  'issue.manage_watchers': '감시자 관리',
  'issue.bulk_edit': '이슈 일괄 편집',
  'time_entry.create': '시간 기록 생성',
  'time_entry.edit': '시간 기록 수정',
  'time_entry.edit_own': '내 시간 기록 수정',
  'time_entry.view': '시간 기록 조회',
  'wiki.view': '위키 조회',
  'wiki.create': '위키 생성',
  'wiki.edit': '위키 편집',
  'wiki.delete': '위키 삭제',
  'document.view': '문서 조회',
  'document.create': '문서 생성',
  'document.edit': '문서 편집',
  'document.delete': '문서 삭제',
  'forum.view': '게시판 조회',
  'forum.create': '게시판 글 작성',
  'forum.edit': '게시판 글 수정',
  'forum.delete': '게시판 글 삭제',
  'news.view': '뉴스 조회',
  'news.create': '뉴스 생성',
  'news.edit': '뉴스 편집',
  'news.delete': '뉴스 삭제',
  'member.manage': '멤버 관리',
};

function getPermissionLabel(key: string, apiLabels?: Record<string, string> | null): string {
  return PERMISSION_LABELS[key] ?? apiLabels?.[key] ?? key;
}

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

  const { data: permissionList } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () =>
      axiosInstance.get<PermissionListResponse>('/admin/permissions').then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });

  const permissionGroups = permissionList?.groups ?? {};
  const permissionApiLabels = permissionList?.labels ?? {};

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) =>
      editRole
        ? axiosInstance.put(`/admin/roles/${editRole.id}`, data)
        : axiosInstance.post('/admin/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
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
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? '역할 삭제에 실패했습니다. 참조 중인 프로젝트가 있을 수 있습니다.');
      setDeleteConfirm(null);
    },
  });

  function openCreate() {
    setEditRole(null);
    setFormName('');
    setFormPermissions([]);
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(role: Role) {
    setEditRole(role);
    setFormName(role.name);
    setFormPermissions(role.permissions ?? []);
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditRole(null);
    setFormError('');
  }

  function togglePermission(key: string) {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  function toggleGroupAll(groupKeys: string[]) {
    const allSelected = groupKeys.every((k) => formPermissions.includes(k));
    if (allSelected) {
      setFormPermissions((prev) => prev.filter((p) => !groupKeys.includes(p)));
    } else {
      setFormPermissions((prev) => [...new Set([...prev, ...groupKeys])]);
    }
  }

  const groupLabels: Record<string, string> = {
    project: '프로젝트',
    issue: '이슈',
    time_entry: '시간 기록',
    wiki: '위키',
    document: '문서',
    forum: '게시판',
    news: '뉴스',
    member: '멤버',
  };

  function getGroupLabel(groupKey: string): string {
    return permissionApiLabels?.[groupKey] ?? groupLabels[groupKey] ?? groupKey;
  }

  function renderSkeleton() {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" sx={{ mb: 1, height: 48, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  function renderPermissionMatrix() {
    const groupEntries = Object.entries(permissionGroups);
    if (groupEntries.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          권한 목록을 불러오는 중...
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {groupEntries.map(([groupKey, permissions]) => {
          const groupPerms = permissions ?? [];
          const allSelected = groupPerms.length > 0 && groupPerms.every((p) => formPermissions.includes(p));
          const someSelected = groupPerms.some((p) => formPermissions.includes(p));

          return (
            <Accordion key={groupKey} defaultExpanded disableGutters variant="outlined">
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 } }}
              >
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={() => toggleGroupAll(groupPerms)}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {getGroupLabel(groupKey)}
                </Typography>
                <Chip
                  label={`${groupPerms.filter((p) => formPermissions.includes(p)).length}/${groupPerms.length}`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                  gap: 0.5,
                }}>
                  {groupPerms.map((permKey) => (
                    <FormControlLabel
                      key={permKey}
                      control={
                        <Checkbox
                          checked={formPermissions.includes(permKey)}
                          onChange={() => togglePermission(permKey)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {getPermissionLabel(permKey, permissionApiLabels)}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  }

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
                    <Chip key={p} label={getPermissionLabel(p, permissionApiLabels)} size="small" variant="outlined" />
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
                        <Chip key={p} label={getPermissionLabel(p, permissionApiLabels)} size="small" variant="outlined" />
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

      {/* Create/Edit Dialog with Permission Matrix */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              권한 ({formPermissions.length}개 선택)
            </Typography>
            {renderPermissionMatrix()}
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
