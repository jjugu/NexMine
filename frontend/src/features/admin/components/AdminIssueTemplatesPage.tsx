import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Skeleton, Card, CardContent,
  useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControlLabel, Checkbox, Alert, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import axiosInstance from '../../../api/axiosInstance';
import type { IssueTemplateDto, ProjectDto } from '../../../api/generated/model';

interface Tracker {
  id: number;
  name: string;
  position: number;
  isDefault: boolean;
}

interface TemplateFormState {
  title: string;
  trackerId: number | '';
  projectId: number | '' | null;
  subjectTemplate: string;
  descriptionTemplate: string;
  isDefault: boolean;
  position: number;
}

const EMPTY_FORM: TemplateFormState = {
  title: '',
  trackerId: '',
  projectId: null,
  subjectTemplate: '',
  descriptionTemplate: '',
  isDefault: false,
  position: 0,
};

export default function AdminIssueTemplatesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<IssueTemplateDto | null>(null);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<IssueTemplateDto | null>(null);

  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['admin-issue-templates'],
    queryFn: () =>
      axiosInstance.get<IssueTemplateDto[]>('/admin/issue-templates').then((res) => res.data),
  });

  const { data: trackers } = useQuery({
    queryKey: ['admin-trackers'],
    queryFn: () => axiosInstance.get<Tracker[]>('/admin/trackers').then((res) => res.data),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list-all'],
    queryFn: () =>
      axiosInstance
        .get<{ items?: ProjectDto[] }>('/projects', { params: { pageSize: 100 } })
        .then((res) => res.data?.items ?? []),
  });

  const trackerList = trackers ?? [];
  const projectList = projectsData ?? [];
  const sortedTemplates = [...(templates ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const saveMutation = useMutation({
    mutationFn: (data: TemplateFormState) => {
      const payload = {
        title: data.title || null,
        trackerId: data.trackerId || undefined,
        projectId: data.projectId || null,
        subjectTemplate: data.subjectTemplate || null,
        descriptionTemplate: data.descriptionTemplate || null,
        isDefault: data.isDefault,
        position: data.position,
      };
      return editTemplate
        ? axiosInstance.put(`/admin/issue-templates/${editTemplate.id}`, payload)
        : axiosInstance.post('/admin/issue-templates', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-templates'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string; title?: string } } })
        ?.response?.data?.detail;
      setFormError(msg ?? '템플릿 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/admin/issue-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issue-templates'] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setFormError(msg ?? '템플릿 삭제에 실패했습니다.');
      setDeleteConfirm(null);
    },
  });

  function openCreate() {
    setEditTemplate(null);
    setForm({
      ...EMPTY_FORM,
      position: templates ? templates.length + 1 : 1,
    });
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(template: IssueTemplateDto) {
    setEditTemplate(template);
    setForm({
      title: template.title ?? '',
      trackerId: template.trackerId ?? '',
      projectId: template.projectId ?? null,
      subjectTemplate: template.subjectTemplate ?? '',
      descriptionTemplate: template.descriptionTemplate ?? '',
      isDefault: template.isDefault ?? false,
      position: template.position ?? 0,
    });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTemplate(null);
    setFormError('');
  }

  function handleSave() {
    if (!form.title.trim()) {
      setFormError('템플릿 이름을 입력해주세요.');
      return;
    }
    if (!form.trackerId) {
      setFormError('트래커를 선택해주세요.');
      return;
    }
    saveMutation.mutate(form);
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">이슈 템플릿 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">이슈 템플릿 관리</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          새 템플릿
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" sx={{ mb: 1, height: 48, borderRadius: 1 }} />
          ))}
        </Box>
      ) : sortedTemplates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ContentPasteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 이슈 템플릿이 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 템플릿 추가
          </Button>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sortedTemplates.map((template) => (
            <Card key={template.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {template.title}
                      {template.isDefault && (
                        <Chip label="기본" color="primary" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      트래커: {template.trackerName ?? '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      프로젝트: {template.projectName ?? '전체'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(template)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(template)}>
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
                <TableCell>트래커</TableCell>
                <TableCell>프로젝트</TableCell>
                <TableCell align="center">기본</TableCell>
                <TableCell align="center">순서</TableCell>
                <TableCell align="center" sx={{ width: 100 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTemplates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>{template.title}</TableCell>
                  <TableCell>{template.trackerName ?? '-'}</TableCell>
                  <TableCell>{template.projectName ?? '전체'}</TableCell>
                  <TableCell align="center">
                    {template.isDefault && <Chip label="기본" color="primary" size="small" />}
                  </TableCell>
                  <TableCell align="center">{template.position}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="수정">
                      <IconButton size="small" onClick={() => openEdit(template)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(template)}>
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
        <DialogTitle>{editTemplate ? '템플릿 수정' : '새 템플릿 추가'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="템플릿 이름"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              autoFocus
            />
            <FormControl fullWidth size="small" required disabled={!!editTemplate}>
              <InputLabel>트래커</InputLabel>
              <Select
                value={form.trackerId}
                label="트래커"
                onChange={(e) => setForm((prev) => ({ ...prev, trackerId: Number(e.target.value) }))}
              >
                {trackerList.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>프로젝트 (선택사항)</InputLabel>
              <Select
                value={form.projectId ?? ''}
                label="프로젝트 (선택사항)"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    projectId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <MenuItem value="">전체 (글로벌)</MenuItem>
                {projectList.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="제목 템플릿"
              value={form.subjectTemplate}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectTemplate: e.target.value }))}
              placeholder="예: [버그] "
            />
            <TextField
              label="설명 템플릿"
              multiline
              rows={5}
              value={form.descriptionTemplate}
              onChange={(e) => setForm((prev) => ({ ...prev, descriptionTemplate: e.target.value }))}
              placeholder="예: ## 재현 순서\n1. \n2. \n\n## 기대 결과\n\n## 실제 결과"
            />
            <TextField
              label="순서"
              type="number"
              value={form.position}
              onChange={(e) => setForm((prev) => ({ ...prev, position: parseInt(e.target.value, 10) || 0 }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />
              }
              label="기본 템플릿"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!form.title.trim() || !form.trackerId || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>템플릿 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.title}&quot; 템플릿을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id!)}
          >
            {deleteMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
