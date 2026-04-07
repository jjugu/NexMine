import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Switch, FormControlLabel, Alert,
  CircularProgress, Grid,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDto } from '../../../api/generated/model';

const createProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요').max(100, '프로젝트명은 100자 이하여야 합니다'),
  identifier: z
    .string()
    .min(1, '식별자를 입력해주세요')
    .max(50, '식별자는 50자 이하여야 합니다')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, '소문자, 숫자, 하이픈만 사용 가능합니다'),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[가-힣]+/g, (match) => {
      // Simple romanization fallback: use initials or just strip
      // For Korean, produce a simplified slug
      return match
        .split('')
        .map((char) => {
          const code = char.charCodeAt(0) - 0xac00;
          if (code < 0 || code > 11171) return '';
          const initialIndex = Math.floor(code / 588);
          const initials = [
            'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
            'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
          ];
          return initials[initialIndex] ?? '';
        })
        .join('');
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProjectCreateDialog({ open, onClose }: ProjectCreateDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isAutoSlug, setIsAutoSlug] = useState(true);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      identifier: '',
      description: '',
      isPublic: true,
    },
  });

  const nameValue = watch('name');

  // Auto-generate identifier from name
  useEffect(() => {
    if (isAutoSlug && nameValue) {
      const slug = slugify(nameValue);
      setValue('identifier', slug, { shouldValidate: slug.length > 0 });
    }
  }, [nameValue, isAutoSlug, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectFormData) =>
      axiosInstance.post<ProjectDto>('/Projects', data).then((res) => res.data),
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
        '프로젝트 생성에 실패했습니다.';
      setServerError(message);
    },
  });

  function handleClose() {
    reset();
    setServerError(null);
    setIsAutoSlug(true);
    onClose();
  }

  function handleFormSubmit(data: CreateProjectFormData) {
    setServerError(null);
    createMutation.mutate(data);
  }

  function handleIdentifierChange() {
    setIsAutoSlug(false);
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>새 프로젝트</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {serverError && (
            <Alert severity="error">{serverError}</Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="프로젝트명"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="식별자"
                fullWidth
                InputLabelProps={{ shrink: !!watch('identifier') }}
                error={!!errors.identifier}
                helperText={errors.identifier?.message ?? '영소문자, 숫자, 하이픈'}
                {...register('identifier', {
                  onChange: handleIdentifierChange,
                })}
              />
            </Grid>
          </Grid>
          <TextField
            label="설명"
            fullWidth
            multiline
            rows={3}
            error={!!errors.description}
            helperText={errors.description?.message}
            {...register('description')}
          />
          <Controller
            name="isPublic"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                  />
                }
                label="공개 프로젝트"
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>취소</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {createMutation.isPending ? '생성 중...' : '생성'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
