import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress, Grid,
  FormControlLabel, Checkbox, Typography, Divider, Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDto } from '../../../api/generated/model';

const copyProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요').max(200, '프로젝트명은 200자 이하여야 합니다'),
  identifier: z
    .string()
    .min(1, '식별자를 입력해주세요')
    .max(100, '식별자는 100자 이하여야 합니다')
    .regex(/^[a-z0-9\-]+$/, '소문자, 숫자, 하이픈만 사용 가능합니다'),
  description: z.string().optional(),
});

type CopyProjectFormData = z.infer<typeof copyProjectSchema>;

interface CopyProjectDialogProps {
  open: boolean;
  onClose: () => void;
  sourceProject: ProjectDto;
}

export default function CopyProjectDialog({ open, onClose, sourceProject }: CopyProjectDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Copy option states
  const [copyMembers, setCopyMembers] = useState(true);
  const [copyVersions, setCopyVersions] = useState(true);
  const [copyCategories, setCopyCategories] = useState(true);
  const [copyModules, setCopyModules] = useState(true);
  const [copyWiki, setCopyWiki] = useState(false);
  const [copyIssues, setCopyIssues] = useState(false);
  const [isPublic, setIsPublic] = useState(sourceProject.isPublic ?? true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CopyProjectFormData>({
    resolver: zodResolver(copyProjectSchema),
    defaultValues: {
      name: `복사: ${sourceProject.name ?? ''}`,
      identifier: `${sourceProject.identifier ?? ''}-copy`,
      description: sourceProject.description ?? '',
    },
  });

  const copyMutation = useMutation({
    mutationFn: (data: CopyProjectFormData) =>
      axiosInstance
        .post<ProjectDto>(`/Projects/${sourceProject.identifier}/copy`, {
          name: data.name,
          identifier: data.identifier,
          description: data.description || null,
          isPublic,
          copyMembers,
          copyVersions,
          copyCategories,
          copyModules,
          copyWiki,
          copyIssues,
        })
        .then((res) => res.data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
      if (project.identifier) {
        navigate(`/projects/${project.identifier}`);
      }
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '프로젝트 복사에 실패했습니다.';
      setServerError(message);
    },
  });

  function handleClose() {
    reset({
      name: `복사: ${sourceProject.name ?? ''}`,
      identifier: `${sourceProject.identifier ?? ''}-copy`,
      description: sourceProject.description ?? '',
    });
    setServerError(null);
    setCopyMembers(true);
    setCopyVersions(true);
    setCopyCategories(true);
    setCopyModules(true);
    setCopyWiki(false);
    setCopyIssues(false);
    setIsPublic(sourceProject.isPublic ?? true);
    onClose();
  }

  function handleFormSubmit(data: CopyProjectFormData) {
    setServerError(null);
    copyMutation.mutate(data);
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>프로젝트 복사</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Typography variant="body2" color="text.secondary">
            원본 프로젝트: <strong>{sourceProject.name}</strong> ({sourceProject.identifier})
          </Typography>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="새 프로젝트명 *"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="새 식별자 *"
                fullWidth
                error={!!errors.identifier}
                helperText={errors.identifier?.message ?? '영소문자, 숫자, 하이픈'}
                {...register('identifier')}
              />
            </Grid>
          </Grid>

          <TextField
            label="설명"
            fullWidth
            multiline
            rows={3}
            {...register('description')}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
            }
            label="공개 프로젝트"
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            복사 옵션
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={copyMembers} onChange={(e) => setCopyMembers(e.target.checked)} />}
              label="멤버 복사"
            />
            <FormControlLabel
              control={<Checkbox checked={copyVersions} onChange={(e) => setCopyVersions(e.target.checked)} />}
              label="버전 복사"
            />
            <FormControlLabel
              control={<Checkbox checked={copyCategories} onChange={(e) => setCopyCategories(e.target.checked)} />}
              label="카테고리 복사"
            />
            <FormControlLabel
              control={<Checkbox checked={copyModules} onChange={(e) => setCopyModules(e.target.checked)} />}
              label="모듈 설정 복사"
            />
            <FormControlLabel
              control={<Checkbox checked={copyWiki} onChange={(e) => setCopyWiki(e.target.checked)} />}
              label="위키 복사"
            />
            <FormControlLabel
              control={<Checkbox checked={copyIssues} onChange={(e) => setCopyIssues(e.target.checked)} />}
              label="이슈 복사"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>취소</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={copyMutation.isPending}
            startIcon={copyMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <ContentCopyIcon />}
          >
            {copyMutation.isPending ? '복사 중...' : '복사'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
