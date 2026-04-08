import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Alert, CircularProgress, List, ListItem, ListItemText,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axiosInstance from '../../../api/axiosInstance';

interface ImportIssuesResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

interface ImportIssuesDialogProps {
  open: boolean;
  onClose: () => void;
  projectIdentifier: string;
  onSuccess: (message: string) => void;
}

export default function ImportIssuesDialog({
  open,
  onClose,
  projectIdentifier,
  onSuccess,
}: ImportIssuesDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportIssuesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return axiosInstance
        .post<ImportIssuesResult>(
          `/projects/${projectIdentifier}/issues/import`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        .then((r) => r.data);
    },
    onSuccess: (result) => {
      setImportResult(result);
      if (result.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['issues'] });
        onSuccess(`${result.successCount}건의 이슈를 가져왔습니다.`);
      }
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        'CSV 가져오기에 실패했습니다.',
      );
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportResult(null);
    setError(null);
  }

  function handleImport() {
    if (!selectedFile) return;
    setError(null);
    setImportResult(null);
    importMutation.mutate(selectedFile);
  }

  function handleClose() {
    if (!importMutation.isPending) {
      setSelectedFile(null);
      setImportResult(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>CSV 가져오기</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Typography variant="body2" color="text.secondary">
          CSV 파일 형식: 제목,트래커,상태,우선순위,담당자,시작일,기한,진행률,설명
        </Typography>
        <Typography variant="caption" color="text.secondary">
          첫 행은 헤더로 무시됩니다. 날짜 형식: yyyy-MM-dd
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            파일 선택
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              {selectedFile.name}
            </Typography>
          )}
        </Box>

        {importResult && (
          <Box>
            <Alert
              severity={importResult.errorCount > 0 ? 'warning' : 'success'}
              sx={{ mb: 1 }}
            >
              {importResult.successCount}건 성공, {importResult.errorCount}건 실패
            </Alert>
            {importResult.errors.length > 0 && (
              <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1 }}>
                {importResult.errors.map((err, idx) => (
                  <ListItem key={idx} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={err}
                      primaryTypographyProps={{ variant: 'caption', color: 'error' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importMutation.isPending}>
          닫기
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importMutation.isPending || !selectedFile || importResult !== null}
          startIcon={importMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {importMutation.isPending ? '가져오는 중...' : '가져오기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
