import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Skeleton,
  Chip, IconButton, Collapse, Divider, Breadcrumbs, Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import axiosInstance from '../../../api/axiosInstance';
import type { NewsDto } from '../../../api/generated/model';

interface NewsFormState {
  title: string;
  summary: string;
  description: string;
}

const EMPTY_FORM: NewsFormState = { title: '', summary: '', description: '' };

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<{ id?: number; name?: string | null; identifier?: string | null }>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function NewsPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNews, setEditNews] = useState<NewsDto | null>(null);
  const [form, setForm] = useState<NewsFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<NewsDto | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: newsList, isLoading, isError } = useQuery({
    queryKey: ['news', identifier],
    queryFn: () =>
      axiosInstance.get<NewsDto[]>(`/projects/${identifier}/news`).then((res) => res.data),
    enabled: !!identifier,
  });

  const saveMutation = useMutation({
    mutationFn: (data: NewsFormState) =>
      editNews
        ? axiosInstance.put(`/news/${editNews.id}`, data)
        : axiosInstance.post(`/projects/${identifier}/news`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', identifier] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string; title?: string } } })
        ?.response?.data?.detail;
      setFormError(msg ?? '뉴스 저장에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', identifier] });
      setDeleteConfirm(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setFormError(msg ?? '뉴스 삭제에 실패했습니다.');
      setDeleteConfirm(null);
    },
  });

  function openCreate() {
    setEditNews(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(news: NewsDto) {
    setEditNews(news);
    setForm({
      title: news.title ?? '',
      summary: news.summary ?? '',
      description: news.description ?? '',
    });
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditNews(null);
    setFormError('');
  }

  function handleToggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setFormError('제목을 입력해주세요.');
      return;
    }
    saveMutation.mutate(form);
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">뉴스 목록을 불러오는 데 실패했습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
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
        <Typography color="text.primary">뉴스</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">뉴스</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          새 뉴스 작성
        </Button>
      </Box>

      {formError && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" sx={{ height: 120, borderRadius: 1 }} />
          ))}
        </Box>
      ) : !newsList || newsList.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <NewspaperIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">등록된 뉴스가 없습니다.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            첫 뉴스 작성
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {newsList.map((news) => {
            const isExpanded = expandedId === news.id;
            return (
              <Card key={news.id} variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box
                      sx={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleToggleExpand(news.id!)}
                    >
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {news.title}
                      </Typography>
                      {news.summary && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {news.summary}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                          label={news.authorName ?? '알 수 없음'}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(news.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleExpand(news.id!)}
                    >
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </CardContent>
                <Collapse in={isExpanded}>
                  <Divider />
                  <CardContent>
                    {news.description ? (
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {news.description}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        내용 없음
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(news)}
                    >
                      수정
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteConfirm(news)}
                    >
                      삭제
                    </Button>
                  </CardActions>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editNews ? '뉴스 수정' : '새 뉴스 작성'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="제목"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              autoFocus
            />
            <TextField
              label="요약"
              multiline
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            />
            <TextField
              label="내용"
              multiline
              rows={6}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>취소</Button>
          <Button
            variant="contained"
            disabled={!form.title.trim() || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>뉴스 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{deleteConfirm?.title}&quot; 뉴스를 삭제하시겠습니까?
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
