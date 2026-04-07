import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box, Typography, Button, TextField, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Skeleton, Breadcrumbs, Link, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, useMediaQuery, useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventNoteIcon from '@mui/icons-material/EventNote';
import axiosInstance from '../../../api/axiosInstance';
import type { VersionDto, ProjectDto } from '../../../api/generated/model';
import { formatDate, VERSION_STATUS_LABELS } from '../utils/issueUtils';

const versionSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100),
  description: z.string().optional(),
  status: z.number(),
  dueDate: z.string().optional().nullable(),
});

type VersionFormData = z.infer<typeof versionSchema>;

function fetchVersions(identifier: string) {
  return axiosInstance
    .get<VersionDto[]>(`/projects/${identifier}/versions`)
    .then((res) => res.data);
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

function getStatusChipColor(status?: number): 'success' | 'warning' | 'default' {
  if (status === 0) return 'success';
  if (status === 1) return 'warning';
  return 'default';
}

export default function VersionListPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<VersionDto | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VersionDto | null>(null);

  const versionsQuery = useQuery({
    queryKey: ['versions', identifier],
    queryFn: () => fetchVersions(identifier!),
    enabled: !!identifier,
  });

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const versions = versionsQuery.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VersionFormData>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 0,
      dueDate: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: VersionFormData) =>
      axiosInstance.post(`/projects/${identifier}/versions`, {
        ...data,
        dueDate: data.dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', identifier] });
      handleCloseDialog();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setServerError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '버전 생성에 실패했습니다.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VersionFormData }) =>
      axiosInstance.put(`/versions/${id}`, {
        ...data,
        dueDate: data.dueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', identifier] });
      handleCloseDialog();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setServerError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '버전 수정에 실패했습니다.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/versions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', identifier] });
      setDeleteTarget(null);
    },
  });

  function handleOpenCreate() {
    setEditingVersion(null);
    reset({ name: '', description: '', status: 0, dueDate: null });
    setServerError(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(version: VersionDto) {
    setEditingVersion(version);
    reset({
      name: version.name ?? '',
      description: version.description ?? '',
      status: version.status ?? 0,
      dueDate: version.dueDate ?? null,
    });
    setServerError(null);
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingVersion(null);
    setServerError(null);
    reset();
  }

  function handleFormSubmit(data: VersionFormData) {
    setServerError(null);
    if (editingVersion?.id) {
      updateMutation.mutate({ id: editingVersion.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget?.id) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
          sx={{ cursor: 'pointer' }}
        >
          프로젝트
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
          sx={{ cursor: 'pointer' }}
        >
          {projectQuery.data?.name ?? identifier}
        </Link>
        <Typography color="text.primary">버전</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">버전</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          새 버전
        </Button>
      </Box>

      {/* Loading */}
      {versionsQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {/* Error */}
      {versionsQuery.isError && (
        <Alert severity="error">버전 목록을 불러오는데 실패했습니다.</Alert>
      )}

      {/* Empty */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <EventNoteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            버전이 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            프로젝트 버전을 추가해보세요
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            새 버전 만들기
          </Button>
        </Box>
      )}

      {/* Desktop: table */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length > 0 && !isMobile && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>종료일</TableCell>
                <TableCell sx={{ width: 100 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {version.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {version.description ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={VERSION_STATUS_LABELS[version.status ?? 0] ?? '-'}
                      size="small"
                      color={getStatusChipColor(version.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(version.dueDate)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenEdit(version)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(version)}
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

      {/* Mobile: cards */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length > 0 && isMobile && (
        <Grid container spacing={1.5}>
          {versions.map((version) => (
            <Grid key={version.id} size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {version.name}
                    </Typography>
                    <Chip
                      label={VERSION_STATUS_LABELS[version.status ?? 0] ?? '-'}
                      size="small"
                      color={getStatusChipColor(version.status)}
                      variant="outlined"
                    />
                  </Box>
                  {version.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {version.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      종료일: {formatDate(version.dueDate)}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenEdit(version)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(version)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>{editingVersion ? '버전 수정' : '새 버전'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <TextField
              label="이름 *"
              fullWidth
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              {...register('name')}
            />
            <TextField
              label="설명"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>상태</InputLabel>
                      <Select
                        value={field.value}
                        label="상태"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        {Object.entries(VERSION_STATUS_LABELS).map(([val, label]) => (
                          <MenuItem key={val} value={Number(val)}>{label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="종료일"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : null)}
                      slotProps={{ textField: { fullWidth: true } }}
                      format="YYYY-MM-DD"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>취소</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
              {isPending ? '저장 중...' : editingVersion ? '수정' : '생성'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>버전 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            버전 &quot;{deleteTarget?.name}&quot;을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
