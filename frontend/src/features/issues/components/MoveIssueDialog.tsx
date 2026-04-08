import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import type {
  ProjectDtoPagedResult,
  IssueDetailDto,
} from '../../../api/generated/model';

interface MoveIssueDialogProps {
  open: boolean;
  onClose: () => void;
  issueId: number;
  currentProjectId: number;
  currentProjectIdentifier: string;
  onSuccess: (message: string) => void;
}

export default function MoveIssueDialog({
  open,
  onClose,
  issueId,
  currentProjectId,
  currentProjectIdentifier,
  onSuccess,
}: MoveIssueDialogProps) {
  const navigate = useNavigate();

  const [targetProjectId, setTargetProjectId] = useState<number>(0);
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

  const projects = (projectsQuery.data?.items ?? []).filter(
    (p) => p.id !== currentProjectId,
  );

  const moveMutation = useMutation({
    mutationFn: () =>
      axiosInstance
        .put<IssueDetailDto>(`/Issues/${issueId}/move`, {
          targetProjectId,
        })
        .then((r) => r.data),
    onSuccess: (movedIssue) => {
      onSuccess('이슈가 이동되었습니다.');
      onClose();
      // Navigate to the issue in its new project
      const targetProject = projects.find((p) => p.id === targetProjectId);
      const targetIdentifier = targetProject?.identifier ?? currentProjectIdentifier;
      navigate(`/projects/${targetIdentifier}/issues/${movedIssue.id}`);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '이슈 이동에 실패했습니다.',
      );
    },
  });

  function handleMove() {
    setError(null);
    moveMutation.mutate();
  }

  function handleClose() {
    if (!moveMutation.isPending) {
      setError(null);
      setTargetProjectId(0);
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>이슈 이동</DialogTitle>
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
            <MenuItem value={0} disabled>
              프로젝트를 선택하세요
            </MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={moveMutation.isPending}>
          취소
        </Button>
        <Button
          onClick={handleMove}
          variant="contained"
          disabled={moveMutation.isPending || !targetProjectId}
          startIcon={moveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {moveMutation.isPending ? '이동 중...' : '이동'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
