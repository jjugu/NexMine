import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Paper, Chip, Skeleton,
  Breadcrumbs, Link, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import axiosInstance from '../../../api/axiosInstance';
import FileUpload from '../../../components/common/FileUpload';
import type { UploadedFile } from '../../../components/common/FileUpload';
import dayjs from 'dayjs';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

interface DocumentDetail {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const { identifier, id } = useParams<{ identifier: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const docQuery = useQuery({
    queryKey: ['document', id],
    queryFn: () =>
      axiosInstance.get<DocumentDetail>(`/projects/${identifier}/documents/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const doc = docQuery.data;

  function handleEditOpen() {
    if (doc) {
      setEditTitle(doc.title);
      setEditDescription(doc.description || '');
      setEditCategory(doc.categoryName || '');
    }
    setEditOpen(true);
  }

  async function handleEditSave() {
    if (!id || !editTitle.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await axiosInstance.put(`/projects/${identifier}/documents/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        categoryName: editCategory.trim() || undefined,
      });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents', identifier] });
    } catch {
      setError('수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await axiosInstance.delete(`/projects/${identifier}/documents/${id}`);
      navigate(`/projects/${identifier}/documents`);
    } catch {
      setError('삭제에 실패했습니다.');
      setDeleting(false);
    }
  }

  async function handleUploadFiles() {
    if (!id || uploadFiles.length === 0) return;
    setUploading(true);

    for (let i = 0; i < uploadFiles.length; i++) {
      const formData = new FormData();
      formData.append('file', uploadFiles[i].file);
      formData.append('attachableType', 'Document');
      formData.append('attachableId', String(id));

      try {
        await axiosInstance.post('/attachments', formData);
      } catch (uploadErr: unknown) {
        const msg = (uploadErr as { response?: { data?: { detail?: string; title?: string } } })?.response?.data?.detail ?? '업로드 실패';
        setUploadFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, error: msg } : f,
          ),
        );
        setError(`파일 업로드 실패: ${msg}`);
      }
    }

    setUploading(false);
    setUploadFiles([]);
    queryClient.invalidateQueries({ queryKey: ['document', id] });
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      await axiosInstance.delete(`/attachments/${attachmentId}`);
      queryClient.invalidateQueries({ queryKey: ['document', id] });
    } catch {
      setError('첨부파일 삭제에 실패했습니다.');
    }
  }

  function handleDownload(attachmentId: number, filename: string) {
    axiosInstance
      .get(`/attachments/${attachmentId}/download`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setError('다운로드에 실패했습니다.');
      });
  }

  if (docQuery.isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  if (docQuery.isError) {
    return <Alert severity="error">문서를 불러오는데 실패했습니다.</Alert>;
  }

  if (!doc) return null;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
        >
          {identifier}
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}/documents`)}
        >
          문서
        </Link>
        <Typography color="text.primary">{doc.title}</Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {doc.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={handleEditOpen}
          >
            수정
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

      {/* Info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              작성자: {doc.authorName}
            </Typography>
          </Box>
          {doc.categoryName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CategoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Chip label={doc.categoryName} size="small" variant="outlined" />
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {dayjs(doc.createdAt).format('YYYY-MM-DD HH:mm')}
            </Typography>
          </Box>
        </Box>
        {doc.description && (
          <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>
            {doc.description}
          </Typography>
        )}
      </Paper>

      {/* Attachments */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        첨부파일
      </Typography>
      {doc.attachments && doc.attachments.length > 0 ? (
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <List dense disablePadding>
            {doc.attachments.map((att, index) => (
              <ListItem
                key={att.id}
                divider={index < doc.attachments!.length - 1}
                sx={{ py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <InsertDriveFileIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={att.fileName}
                  secondary={`${formatFileSize(att.size)} - ${dayjs(att.createdAt).format('YYYY-MM-DD')}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(att.id, att.fileName)}
                    sx={{ mr: 0.5 }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteAttachment(att.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          첨부파일이 없습니다.
        </Typography>
      )}

      {/* Upload additional files */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          파일 추가
        </Typography>
        <FileUpload files={uploadFiles} onFilesChange={setUploadFiles} />
        {uploadFiles.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleUploadFiles}
              disabled={uploading}
            >
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>문서 수정</DialogTitle>
        <DialogContent>
          <TextField
            label="제목"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            fullWidth
            required
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="설명"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            label="카테고리"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>
            취소
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>문서 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            &quot;{doc.title}&quot; 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            취소
          </Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
