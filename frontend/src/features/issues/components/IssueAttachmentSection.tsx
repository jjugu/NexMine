import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, IconButton, Chip, CircularProgress,
  Skeleton, Tooltip, Alert,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import axiosInstance from '../../../api/axiosInstance';
import { formatDateTime } from '../utils/issueUtils';

interface AttachmentDto {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
  attachableType: string;
  attachableId: number;
  description: string | null;
  authorName: string;
  createdAt: string;
}

interface AttachmentUploadResult {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return <ImageIcon fontSize="small" color="primary" />;
  if (contentType === 'application/pdf') return <PictureAsPdfIcon fontSize="small" color="error" />;
  return <InsertDriveFileIcon fontSize="small" color="action" />;
}

interface IssueAttachmentSectionProps {
  issueId: number;
}

export default function IssueAttachmentSection({ issueId }: IssueAttachmentSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', 'Issue', issueId],
    queryFn: () =>
      axiosInstance
        .get<AttachmentDto[]>('/attachments', {
          params: { attachableType: 'Issue', attachableId: issueId },
        })
        .then((r) => r.data),
    enabled: !!issueId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachableType', 'Issue');
      formData.append('attachableId', String(issueId));
      return axiosInstance
        .post<AttachmentUploadResult>('/attachments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', 'Issue', issueId] });
      setError(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail ?? '파일 업로드에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', 'Issue', issueId] });
    },
    onError: () => {
      setError('첨부파일 삭제에 실패했습니다.');
    },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      uploadMutation.mutate(files[i]);
    }
    e.target.value = '';
  }

  async function handleDownload(attachment: AttachmentDto) {
    try {
      const response = await axiosInstance.get(
        `/attachments/${attachment.id}/download`,
        { responseType: 'blob' },
      );
      const blob = new Blob([response.data], { type: attachment.contentType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = attachment.fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setError('파일 다운로드에 실패했습니다.');
    }
  }

  const attachments = attachmentsQuery.data ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          첨부파일 ({attachments.length})
        </Typography>
        <Button
          size="small"
          startIcon={uploadMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AttachFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? '업로드 중...' : '파일 첨부'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {attachmentsQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {attachments.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {attachments.map((attachment) => (
            <Box
              key={attachment.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                px: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              {getFileIcon(attachment.contentType)}
              <Box
                sx={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                onClick={() => handleDownload(attachment)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                  }}
                >
                  {attachment.fileName}
                </Typography>
              </Box>
              <Chip
                label={formatFileSize(attachment.size)}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {attachment.authorName} &middot; {formatDateTime(attachment.createdAt)}
              </Typography>
              <Tooltip title="다운로드">
                <IconButton size="small" onClick={() => handleDownload(attachment)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="삭제">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => deleteMutation.mutate(attachment.id)}
                  disabled={deleteMutation.isPending}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      ) : (
        !attachmentsQuery.isLoading && (
          <Typography variant="body2" color="text.secondary">
            첨부파일이 없습니다.
          </Typography>
        )
      )}
    </Box>
  );
}
