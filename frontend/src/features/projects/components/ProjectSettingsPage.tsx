import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Alert, Paper, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Skeleton, Breadcrumbs, Link, Chip, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArchiveIcon from '@mui/icons-material/Archive';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../../api/axiosInstance';
import CopyProjectDialog from './CopyProjectDialog';
import type {
  ProjectDto,
  ProjectMemberDto,
  IssueCategoryDto,
  UpdateProjectRequest,
  ProjectModulesDto,
} from '../../../api/generated/model';

// --- API functions ---

function fetchProject(identifier: string) {
  return axiosInstance.get<ProjectDto>(`/Projects/${identifier}`).then((r) => r.data);
}

function fetchMembers(identifier: string) {
  return axiosInstance.get<ProjectMemberDto[]>(`/projects/${identifier}/members`).then((r) => r.data);
}

function fetchCategories(identifier: string) {
  return axiosInstance.get<IssueCategoryDto[]>(`/projects/${identifier}/categories`).then((r) => r.data);
}

// --- Zod schemas ---

const projectInfoSchema = z.object({
  name: z.string().min(1, '프로젝트 이름을 입력해주세요').max(100, '이름은 100자 이하여야 합니다'),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

type ProjectInfoFormData = z.infer<typeof projectInfoSchema>;

const addMemberSchema = z.object({
  userId: z.number().min(1, '사용자를 선택해주세요'),
  roleId: z.number().min(1, '역할을 선택해주세요'),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

// --- Sub-components ---

function ProjectInfoSection({ identifier }: { identifier: string }) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ['project-settings', identifier],
    queryFn: () => fetchProject(identifier),
    enabled: !!identifier,
  });

  const project = projectQuery.data;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<ProjectInfoFormData>({
    resolver: zodResolver(projectInfoSchema),
    values: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      isPublic: project?.isPublic ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectRequest) =>
      axiosInstance.put(`/Projects/${identifier}`, data).then((r) => r.data),
    onSuccess: () => {
      setSuccessMsg('프로젝트 정보가 저장되었습니다.');
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['project-settings', identifier] });
      queryClient.invalidateQueries({ queryKey: ['project', identifier] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          '프로젝트 정보 저장에 실패했습니다.'
        );
      }
      setSuccessMsg(null);
    },
  });

  function handleFormSubmit(data: ProjectInfoFormData) {
    setServerError(null);
    setSuccessMsg(null);
    updateMutation.mutate({
      name: data.name,
      description: data.description || null,
      isPublic: data.isPublic,
    });
  }

  if (projectQuery.isLoading) {
    return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />;
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>프로젝트 정보</Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="프로젝트 이름 *"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="설명"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={field.onChange} />
                  }
                  label="공개 프로젝트"
                />
              )}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending || !isDirty}
            startIcon={updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

function MembersSection({ identifier }: { identifier: string }) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ['project-members', identifier],
    queryFn: () => fetchMembers(identifier),
    enabled: !!identifier,
  });

  const members = membersQuery.data ?? [];

  const removeMutation = useMutation({
    mutationFn: (memberId: number) =>
      axiosInstance.delete(`/projects/${identifier}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', identifier] });
      setConfirmDeleteId(null);
      setServerError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          '멤버 삭제에 실패했습니다.'
        );
      }
      setConfirmDeleteId(null);
    },
  });

  function handleRemove(memberId: number) {
    removeMutation.mutate(memberId);
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">멤버 관리</Typography>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          size="small"
          onClick={() => setAddDialogOpen(true)}
        >
          멤버 추가
        </Button>
      </Box>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {membersQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {!membersQuery.isLoading && members.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          등록된 멤버가 없습니다.
        </Typography>
      )}

      {!membersQuery.isLoading && members.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>역할</TableCell>
                <TableCell sx={{ width: 80 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>
                    <Chip label={member.roleName ?? '멤버'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setConfirmDeleteId(member.id!)}
                      disabled={removeMutation.isPending}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>멤버 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>이 멤버를 프로젝트에서 제거하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDeleteId !== null && handleRemove(confirmDeleteId)}
            disabled={removeMutation.isPending}
          >
            {removeMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        identifier={identifier}
      />
    </Paper>
  );
}

function AddMemberDialog({
  open,
  onClose,
  identifier,
}: {
  open: boolean;
  onClose: () => void;
  identifier: string;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: 0, roleId: 0 },
  });

  // Simple role options (common Redmine-style roles)
  const roleOptions = [
    { id: 3, name: '관리자' },
    { id: 4, name: '개발자' },
    { id: 5, name: '보고자' },
  ];

  const addMutation = useMutation({
    mutationFn: (data: AddMemberFormData) =>
      axiosInstance.post(`/projects/${identifier}/members`, {
        userId: data.userId,
        roleId: data.roleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', identifier] });
      setServerError(null);
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          '멤버 추가에 실패했습니다.'
        );
      }
    },
  });

  function handleDialogClose() {
    setServerError(null);
    reset();
    onClose();
  }

  function handleFormSubmit(data: AddMemberFormData) {
    setServerError(null);
    addMutation.mutate(data);
  }

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>멤버 추가</DialogTitle>
      <DialogContent>
        {serverError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{serverError}</Alert>}
        <form id="add-member-form" onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="사용자 ID *"
                    fullWidth
                    type="number"
                    error={!!errors.userId}
                    helperText={errors.userId?.message || '추가할 사용자의 ID를 입력해주세요'}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.roleId}>
                    <InputLabel>역할 *</InputLabel>
                    <Select
                      value={field.value || ''}
                      label="역할 *"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>취소</Button>
        <Button
          type="submit"
          form="add-member-form"
          variant="contained"
          disabled={addMutation.isPending}
          startIcon={addMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
        >
          {addMutation.isPending ? '추가 중...' : '추가'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoriesSection({ identifier }: { identifier: string }) {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', identifier],
    queryFn: () => fetchCategories(identifier),
    enabled: !!identifier,
  });

  const categories = categoriesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      axiosInstance.post(`/projects/${identifier}/categories`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', identifier] });
      setNewCategoryName('');
      setServerError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(axiosError.response?.data?.detail || '카테고리 생성에 실패했습니다.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      axiosInstance.put(`/projects/${identifier}/categories/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', identifier] });
      setEditingId(null);
      setEditingName('');
      setServerError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(axiosError.response?.data?.detail || '카테고리 수정에 실패했습니다.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      axiosInstance.delete(`/projects/${identifier}/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', identifier] });
      setConfirmDeleteId(null);
      setServerError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(axiosError.response?.data?.detail || '카테고리 삭제에 실패했습니다.');
      }
    },
  });

  function handleCreate() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  function handleStartEdit(cat: IssueCategoryDto) {
    setEditingId(cat.id!);
    setEditingName(cat.name ?? '');
  }

  function handleSaveEdit() {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    updateMutation.mutate({ id: editingId, name: trimmed });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>카테고리 관리</Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {/* Add new category */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="새 카테고리"
          size="small"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={createMutation.isPending || !newCategoryName.trim()}
        >
          추가
        </Button>
      </Box>

      {categoriesQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {!categoriesQuery.isLoading && categories.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          등록된 카테고리가 없습니다.
        </Typography>
      )}

      {!categoriesQuery.isLoading && categories.length > 0 && (
        <List disablePadding>
          {categories.map((cat, idx) => (
            <Box key={cat.id}>
              {idx > 0 && <Divider />}
              <ListItem sx={{ px: 1 }}>
                {editingId === cat.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <TextField
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); }
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      sx={{ flex: 1 }}
                      autoFocus
                    />
                    <IconButton size="small" color="primary" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleCancelEdit}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <ListItemText primary={cat.name} />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleStartEdit(cat)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(cat.id!)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>카테고리 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>이 카테고리를 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDeleteId !== null && deleteMutation.mutate(confirmDeleteId)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// --- Module labels (Korean) ---
const MODULE_LABELS: Record<string, string> = {
  issues: '이슈 트래킹',
  boards: '칸반 보드',
  gantt: '간트차트',
  calendar: '캘린더',
  wiki: '위키',
  documents: '문서',
  news: '뉴스',
  forums: '게시판',
  time_tracking: '시간 기록',
  roadmap: '로드맵',
  activity: '활동',
};

function ModulesSection({ identifier }: { identifier: string }) {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const modulesQuery = useQuery({
    queryKey: ['project-modules', identifier],
    queryFn: () =>
      axiosInstance
        .get<ProjectModulesDto>(`/Projects/${identifier}/modules`)
        .then((r) => r.data),
    enabled: !!identifier,
  });

  const allModules = modulesQuery.data?.allModules ?? [];
  const enabledModules = modulesQuery.data?.enabledModules ?? [];

  const [localEnabled, setLocalEnabled] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync local state when data loads
  if (modulesQuery.data && !initialized) {
    setLocalEnabled(enabledModules);
    setInitialized(true);
  }

  // Reset initialized flag when identifier changes
  const [prevIdentifier, setPrevIdentifier] = useState(identifier);
  if (prevIdentifier !== identifier) {
    setPrevIdentifier(identifier);
    setInitialized(false);
  }

  function handleToggle(moduleKey: string) {
    setLocalEnabled((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put(`/Projects/${identifier}/modules`, {
        enabledModules: localEnabled,
      }),
    onSuccess: () => {
      setSnackbar({ open: true, message: '모듈 설정이 저장되었습니다.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['project-modules', identifier] });
      queryClient.invalidateQueries({ queryKey: ['project', identifier] });
      queryClient.invalidateQueries({ queryKey: ['project-settings', identifier] });
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setSnackbar({ open: true, message: '권한이 없습니다.', severity: 'error' });
      } else {
        setSnackbar({
          open: true,
          message: axiosError.response?.data?.detail || axiosError.response?.data?.title || '모듈 설정 저장에 실패했습니다.',
          severity: 'error',
        });
      }
    },
  });

  const isDirty = initialized && (
    localEnabled.length !== enabledModules.length ||
    localEnabled.some((m) => !enabledModules.includes(m))
  );

  if (modulesQuery.isLoading) {
    return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 3 }} />;
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>모듈</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        프로젝트에서 사용할 모듈을 선택합니다. 비활성화된 모듈은 사이드바와 프로젝트 메뉴에서 숨겨집니다.
      </Typography>

      <Grid container spacing={1}>
        {allModules.map((moduleKey) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={moduleKey}>
            <FormControlLabel
              control={
                <Switch
                  checked={localEnabled.includes(moduleKey)}
                  onChange={() => handleToggle(moduleKey)}
                />
              }
              label={MODULE_LABELS[moduleKey] ?? moduleKey}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          disabled={saveMutation.isPending || !isDirty}
          startIcon={saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

function CopyProjectSection({ project }: { project: ProjectDto | undefined }) {
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  if (!project) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>프로젝트 복사</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        이 프로젝트의 설정과 데이터를 기반으로 새 프로젝트를 생성합니다.
      </Typography>
      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={() => setCopyDialogOpen(true)}
      >
        프로젝트 복사
      </Button>
      <CopyProjectDialog
        open={copyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
        sourceProject={project}
      />
    </Paper>
  );
}

function ArchiveSection({ identifier }: { identifier: string }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const archiveMutation = useMutation({
    mutationFn: () =>
      axiosInstance.delete(`/Projects/${identifier}`),
    onSuccess: () => {
      navigate('/projects', { replace: true });
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 403) {
        setServerError('권한이 없습니다.');
      } else {
        setServerError(
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          '프로젝트 아카이브에 실패했습니다.'
        );
      }
      setConfirmOpen(false);
    },
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderColor: 'error.main',
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: 'error.main' }}>위험 영역</Typography>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        프로젝트를 아카이브하면 더 이상 접근할 수 없습니다. 이 작업은 되돌릴 수 없습니다.
      </Typography>

      <Button
        variant="outlined"
        color="error"
        startIcon={<ArchiveIcon />}
        onClick={() => setConfirmOpen(true)}
      >
        프로젝트 아카이브
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>프로젝트 아카이브 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 프로젝트를 아카이브하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? '처리 중...' : '아카이브'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// --- Main page component ---

export default function ProjectSettingsPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  if (!identifier) {
    return (
      <Box>
        <Alert severity="error">프로젝트 식별자가 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
        >
          프로젝트
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
        >
          {projectQuery.data?.name ?? identifier}
        </Link>
        <Typography color="text.primary">설정</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>프로젝트 설정</Typography>

      <ProjectInfoSection identifier={identifier} />
      <MembersSection identifier={identifier} />
      <CategoriesSection identifier={identifier} />
      <ModulesSection identifier={identifier} />
      <CopyProjectSection project={projectQuery.data} />
      <ArchiveSection identifier={identifier} />
    </Box>
  );
}
