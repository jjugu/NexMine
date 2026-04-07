import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, useMediaQuery, useTheme,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import FileUpload from '../../../components/common/FileUpload';
import type { UploadedFile } from '../../../components/common/FileUpload';

interface DocumentCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  projectIdentifier: string;
}

export default function DocumentCreateDialog({ open, onClose, onCreated, projectIdentifier }: DocumentCreateDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle('');
    setDescription('');
    setCategoryName('');
    setFiles([]);
    setError(null);
  }

  function handleClose() {
    if (!saving) {
      resetForm();
      onClose();
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await axiosInstance.post(`/projects/${projectIdentifier}/documents`, {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryName: categoryName.trim() || undefined,
      });

      const documentId = res.data?.id;

      if (documentId && files.length > 0) {
        const failedFiles: string[] = [];
        for (const f of files) {
          const formData = new FormData();
          formData.append('file', f.file);
          formData.append('attachableType', 'Document');
          formData.append('attachableId', String(documentId));

          try {
            await axiosInstance.post('/attachments', formData);
          } catch (uploadErr: unknown) {
            const msg = (uploadErr as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '알 수 없는 오류';
            failedFiles.push(`${f.file.name}: ${msg}`);
          }
        }
        if (failedFiles.length > 0) {
          setError(`일부 파일 업로드 실패:\n${failedFiles.join('\n')}`);
          setSaving(false);
          onCreated(); // 문서는 생성됨, 목록 갱신
          return;
        }
      }

      resetForm();
      onCreated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '문서 생성에 실패했습니다.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
    >
      <DialogTitle>새 문서</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <TextField
          label="카테고리"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          fullWidth
          size="small"
          placeholder="분류를 입력하세요"
          sx={{ mb: 2 }}
        />

        <FileUpload files={files} onFilesChange={setFiles} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '생성 중...' : '생성'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
