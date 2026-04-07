import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Skeleton, Card, CardContent, Alert,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import axiosInstance from '../../../api/axiosInstance';
import type { CustomFieldDto } from '../../../api/generated/model';
import CustomFieldDialog from './CustomFieldDialog';

const FIELD_FORMAT_LABELS: Record<number, string> = {
  0: '텍스트',
  1: '장문 텍스트',
  2: '정수',
  3: '실수',
  4: '날짜',
  5: '불린',
  6: '목록',
  7: '링크',
};

const CUSTOMIZABLE_LABELS: Record<string, string> = {
  issue: '이슈',
  project: '프로젝트',
  user: '사용자',
};

export default function AdminCustomFieldsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editField, setEditField] = useState<CustomFieldDto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomFieldDto | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data: customFields, isLoading, isError } = useQuery({
    queryKey: ['admin', 'custom-fields'],
    queryFn: () => axiosInstance.get<CustomFieldDto[]>('/admin/custom-fields').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/custom-fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-fields'] });
      setDeleteConfirm(null);
      setDeleteError('');
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string; message?: string } } };
      setDeleteError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        axiosError.response?.data?.message ||
        '커스텀 필드 삭제에 실패했습니다.',
      );
      setDeleteConfirm(null);
    },
  });

  const sortedFields = [...(customFields ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  function openCreate() {
    setEditField(null);
    setDialogOpen(true);
  }

  function openEdit(field: CustomFieldDto) {
    setEditField(field);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditField(null);
  }

  function handleDialogSaved() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'custom-fields'] });
    handleDialogClose();
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">커스텀 필드 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">커스텀 필드 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          새 커스텀 필드
        </Button>
      </Box>

      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}

      {isLoading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" sx={{ mb: 1, height: 48, borderRadius: 1 }} />
          ))}
        </Box>
      ) : sortedFields.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TuneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 커스텀 필드가 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 커스텀 필드 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedFields.map((field) => (
            <Card key={field.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{field.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip
                        label={FIELD_FORMAT_LABELS[field.fieldFormat ?? 0] ?? '알 수 없음'}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={CUSTOMIZABLE_LABELS[field.customizable ?? ''] ?? field.customizable}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                      {field.isRequired && <Chip label="필수" size="small" color="warning" />}
                      {field.isForAll && <Chip label="전체" size="small" color="success" variant="outlined" />}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => openEdit(field)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(field)}>
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
                <TableCell>유형</TableCell>
                <TableCell>대상</TableCell>
                <TableCell align="center">필수</TableCell>
                <TableCell align="center">전체 프로젝트</TableCell>
                <TableCell align="center">순서</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedFields.map((field) => (
                <TableRow key={field.id} hover sx={{ cursor: 'pointer' }} onClick={() => openEdit(field)}>
                  <TableCell>{field.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={FIELD_FORMAT_LABELS[field.fieldFormat ?? 0] ?? '알 수 없음'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {CUSTOMIZABLE_LABELS[field.customizable ?? ''] ?? field.customizable}
                  </TableCell>
                  <TableCell align="center">
                    {field.isRequired && <Chip label="필수" size="small" color="warning" />}
                  </TableCell>
                  <TableCell align="center">
                    {field.isForAll && <Chip label="전체" size="small" color="success" variant="outlined" />}
                  </TableCell>
                  <TableCell align="center">{field.position}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="수정">
                      <IconButton size="small" onClick={() => openEdit(field)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(field)}>
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

      {/* Custom field dialog */}
      <CustomFieldDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleDialogSaved}
        editField={editField}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>커스텀 필드 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.name}&quot; 커스텀 필드를 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 필드를 사용하는 이슈의 커스텀 값도 함께 삭제됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteConfirm?.id && deleteMutation.mutate(deleteConfirm.id)}
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
