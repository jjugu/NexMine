import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Chip, Skeleton, Divider,
  List, ListItemButton, ListItemIcon, ListItemText, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { useState, useCallback } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import PersonIcon from '@mui/icons-material/Person';
import UpdateIcon from '@mui/icons-material/Update';
import axiosInstance from '../../../api/axiosInstance';
import SafeHtml from '../../../components/common/SafeHtml';
import dayjs from 'dayjs';

interface WikiPage {
  id: number;
  title: string;
  slug: string;
  contentHtml: string;
  parentPageId: number | null;
  authorName: string;
  version: number;
  updatedAt: string;
  children: Array<{ id: number; title: string; slug: string }>;
}

interface WikiPageViewProps {
  slug?: string;
  onDeleted?: () => void;
}

export default function WikiPageView({ slug: propSlug, onDeleted }: WikiPageViewProps) {
  const { identifier, slug: paramSlug } = useParams<{ identifier: string; slug?: string }>();
  const slug = propSlug ?? paramSlug;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageQuery = useQuery({
    queryKey: ['wiki-page', identifier, slug],
    queryFn: () =>
      axiosInstance.get<WikiPage>(`/projects/${identifier}/wiki/${slug}`).then((r) => r.data),
    enabled: !!identifier && !!slug,
  });

  const handleDelete = useCallback(async () => {
    if (!identifier || !slug) return;
    setDeleting(true);
    setError(null);
    try {
      await axiosInstance.delete(`/projects/${identifier}/wiki/${slug}`);
      queryClient.invalidateQueries({ queryKey: ['wiki-pages', identifier] });
      setDeleteOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        navigate(`/projects/${identifier}/wiki`);
      }
    } catch {
      setError('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }, [identifier, slug, navigate, queryClient, onDeleted]);

  if (!slug) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          위키에 오신 것을 환영합니다
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          왼쪽 목록에서 페이지를 선택하거나 새 페이지를 만드세요.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/projects/${identifier}/wiki/new`)}
        >
          새 페이지 만들기
        </Button>
      </Box>
    );
  }

  if (pageQuery.isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }

  if (pageQuery.isError) {
    return (
      <Alert severity="error">위키 페이지를 불러오는데 실패했습니다.</Alert>
    );
  }

  const page = pageQuery.data;
  if (!page) return null;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {page.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {page.authorName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <UpdateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {dayjs(page.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Typography>
            </Box>
            <Chip label={`버전 ${page.version}`} size="small" variant="outlined" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/projects/${identifier}/wiki/${slug}/edit`)}
          >
            수정
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/projects/${identifier}/wiki/${slug}`, { state: { showHistory: true } })}
          >
            히스토리
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            삭제
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Content */}
      <SafeHtml html={page.contentHtml || ''} sx={{ mb: 3 }} />

      {/* Children pages */}
      {page.children && page.children.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            하위 페이지
          </Typography>
          <List dense disablePadding>
            {page.children.map((child) => (
              <ListItemButton
                key={child.id}
                onClick={() => navigate(`/projects/${identifier}/wiki/${child.slug}`)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ArticleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={child.title} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>페이지 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &quot;{page.title}&quot; 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            취소
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
