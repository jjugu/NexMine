import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, CircularProgress, Alert,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import type {
  ProjectDtoPagedResult,
  IssueDetailDto,
} from '../../../api/generated/model';

interface CopyIssueDialogProps {
  open: boolean;
  onClose: () => void;
  issueId: number;
  currentProjectId: number;
  currentProjectIdentifier: string;
  onSuccess: (message: string) => void;
}

export default function CopyIssueDialog({
  open,
  onClose,
  issueId,
  currentProjectId,
  currentProjectIdentifier,
  onSuccess,
}: CopyIssueDialogProps) {
  const navigate = useNavigate();

  const [targetProjectId, setTargetProjectId] = useState<number>(currentProjectId);
  const [copyDescription, setCopyDescription] = useState(true);
  const [copyWatchers, setCopyWatchers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () =>
      axiosInstance
        .get<ProjectDtoPagedResult>('/Projects', { params: { pageSize: 100 } })
        .then((r) => r.data),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const projects = projectsQuery.data?.items ?? [];

  const copyMutation = useMutation({
    mutationFn: () =>
      axiosInstance
        .post<IssueDetailDto>(`/Issues/${issueId}/copy`, {
          targetProjectId,
          copyDescription,
          copyWatchers,
        })
        .then((r) => r.data),
    onSuccess: (newIssue) => {
      onSuccess('이슈가 복사되었습니다.');
      onClose();
      // Find the target project identifier
      const targetProject = projects.find((p) => p.id === targetProjectId);
      const targetIdentifier = targetProject?.identifier ?? currentProjectIdentifier;
      navigate(`/projects/${targetIdentifier}/issues/${newIssue.id}`);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '이슈 복사에 실패했습니다.',
      );
    },
  });

  function handleCopy() {
    setError(null);
    copyMutation.mutate();
  }

  function handleClose() {
    if (!copyMutation.isPending) {
      setError(null);
      setTargetProjectId(currentProjectId);
      setCopyDescription(true);
      setCopyWatchers(false);
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>이슈 복사</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth size="small">
          <InputLabel>대상 프로젝트</InputLabel>
          <Select
            value={targetProjectId}
            label="대상 프로젝트"
            onChange={(e) => setTargetProjectId(Number(e.target.value))}
            disabled={projectsQuery.isLoading}
          >
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={copyDescription}
              onChange={(e) => setCopyDescription(e.target.checked)}
            />
          }
          label="설명 복사"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={copyWatchers}
              onChange={(e) => setCopyWatchers(e.target.checked)}
            />
          }
          label="감시자 복사"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={copyMutation.isPending}>
          취소
        </Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          disabled={copyMutation.isPending || !targetProjectId}
          startIcon={copyMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {copyMutation.isPending ? '복사 중...' : '복사'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
