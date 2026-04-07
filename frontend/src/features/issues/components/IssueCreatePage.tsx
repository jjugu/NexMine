import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Alert,
  CircularProgress, Grid, Breadcrumbs, Link,
  MenuItem, Select, FormControl, InputLabel, Slider,
  FormControlLabel, Switch, Paper, Checkbox, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axiosInstance from '../../../api/axiosInstance';
import type { IssueDetailDto, ProjectDto, CustomFieldDto } from '../../../api/generated/model';
import {
  useTrackers,
  useIssueStatuses,
  useIssuePriorities,
  useCategories,
  useVersions,
  useProjectMembers,
} from '../hooks/useReferenceData';

const createIssueSchema = z.object({
  trackerId: z.number().min(1, '트래커를 선택해주세요'),
  subject: z.string().min(1, '제목을 입력해주세요').max(255, '제목은 255자 이하여야 합니다'),
  description: z.string().optional(),
  statusId: z.number().optional().nullable(),
  priorityId: z.number().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  versionId: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  doneRatio: z.number().min(0).max(100).optional().nullable(),
  isPrivate: z.boolean(),
});

type CreateIssueFormData = z.infer<typeof createIssueSchema>;

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

function renderCustomFieldInput(
  cf: CustomFieldDto,
  value: string,
  onChange: (val: string) => void,
) {
  const label = cf.isRequired ? `${cf.name} *` : (cf.name ?? '');
  const fieldFormat = cf.fieldFormat ?? 0;

  switch (fieldFormat) {
    case 0: // String
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
        />
      );
    case 1: // Text
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          multiline
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
        />
      );
    case 2: // Int
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          type="number"
          slotProps={{ htmlInput: { step: 1 } }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
        />
      );
    case 3: // Float
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          type="number"
          slotProps={{ htmlInput: { step: 0.01 } }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
        />
      );
    case 4: // Date
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );
    case 5: // Bool
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            />
          }
          label={cf.name ?? ''}
        />
      );
    case 6: // List
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            value={value}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            required={cf.isRequired}
          >
            <MenuItem value="">없음</MenuItem>
            {(cf.possibleValues ?? []).map((pv) => (
              <MenuItem key={pv} value={pv}>{pv}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    case 7: // Link
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          type="url"
          placeholder="https://"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={cf.isRequired}
        />
      );
    default:
      return (
        <TextField
          label={label}
          fullWidth
          size="small"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function IssueCreatePage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<number, string>>({});

  const trackersQuery = useTrackers();
  const statusesQuery = useIssueStatuses();
  const prioritiesQuery = useIssuePriorities();
  const categoriesQuery = useCategories(identifier);
  const versionsQuery = useVersions(identifier);
  const membersQuery = useProjectMembers(identifier);

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const customFieldsQuery = useQuery({
    queryKey: ['custom-fields', identifier],
    queryFn: () =>
      axiosInstance
        .get<CustomFieldDto[]>(`/projects/${identifier}/custom-fields`, { params: { customizable: 'issue' } })
        .then((r) => r.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const trackers = trackersQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const priorities = prioritiesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const versions = versionsQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const customFields = customFieldsQuery.data ?? [];

  const defaultTrackerId = trackers.find((t) => t.isDefault)?.id ?? trackers[0]?.id ?? 0;
  const defaultStatusId = statuses[0]?.id ?? null;
  const defaultPriorityId = priorities.find((p) => p.isDefault)?.id ?? priorities[0]?.id ?? null;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    values: {
      trackerId: defaultTrackerId,
      subject: '',
      description: '',
      statusId: defaultStatusId,
      priorityId: defaultPriorityId,
      assignedToId: null,
      categoryId: null,
      versionId: null,
      startDate: null,
      dueDate: null,
      estimatedHours: null,
      doneRatio: 0,
      isPrivate: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIssueFormData) => {
      const customValuesPayload = Object.entries(customValues)
        .filter(([, v]) => v !== '')
        .map(([fieldId, value]) => ({ customFieldId: Number(fieldId), value }));
      const payload = {
        ...data,
        statusId: data.statusId || undefined,
        priorityId: data.priorityId || undefined,
        assignedToId: data.assignedToId || undefined,
        categoryId: data.categoryId || undefined,
        versionId: data.versionId || undefined,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours || undefined,
        doneRatio: data.doneRatio ?? 0,
        customValues: customValuesPayload.length > 0 ? customValuesPayload : undefined,
      };
      return axiosInstance
        .post<IssueDetailDto>(`/projects/${identifier}/issues`, payload)
        .then((res) => res.data);
    },
    onSuccess: (issue) => {
      queryClient.invalidateQueries({ queryKey: ['issues', identifier] });
      navigate(`/projects/${identifier}/issues/${issue.id}`);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '이슈 생성에 실패했습니다.';
      setServerError(message);
    },
  });

  function handleFormSubmit(data: CreateIssueFormData) {
    setServerError(null);
    createMutation.mutate(data);
  }

  function handleCancel() {
    navigate(`/projects/${identifier}/issues`);
  }

  const isDataLoading =
    trackersQuery.isLoading || statusesQuery.isLoading || prioritiesQuery.isLoading;

  if (isDataLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ height: 56, bgcolor: 'action.hover', borderRadius: 1 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
          sx={{ cursor: 'pointer' }}
        >
          프로젝트
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
          sx={{ cursor: 'pointer' }}
        >
          {projectQuery.data?.name ?? identifier}
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}/issues`)}
          sx={{ cursor: 'pointer' }}
        >
          이슈
        </Link>
        <Typography color="text.primary">새 이슈</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 3 }}>새 이슈</Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={2}>
            {/* Row 1: Tracker + Subject */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="trackerId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.trackerId}>
                    <InputLabel>트래커 *</InputLabel>
                    <Select
                      value={field.value || ''}
                      label="트래커 *"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {trackers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              <TextField
                label="제목 *"
                fullWidth
                error={!!errors.subject}
                helperText={errors.subject?.message}
                {...register('subject')}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="설명"
                fullWidth
                multiline
                rows={4}
                {...register('description')}
              />
            </Grid>

            {/* Row 2: Status + Priority + Assignee */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="statusId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={field.value ?? ''}
                      label="상태"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      {statuses.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="priorityId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>우선순위</InputLabel>
                    <Select
                      value={field.value ?? ''}
                      label="우선순위"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      {priorities.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>담당자</InputLabel>
                    <Select
                      value={field.value ?? ''}
                      label="담당자"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <MenuItem value="">미배정</MenuItem>
                      {members.map((m) => (
                        <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 3: Category + Version */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>카테고리</InputLabel>
                    <Select
                      value={field.value ?? ''}
                      label="카테고리"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <MenuItem value="">없음</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="versionId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>대상 버전</InputLabel>
                    <Select
                      value={field.value ?? ''}
                      label="대상 버전"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <MenuItem value="">없음</MenuItem>
                      {versions.map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 4: Dates + Estimated hours */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="시작일"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : null)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    format="YYYY-MM-DD"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="종료일"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : null)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    format="YYYY-MM-DD"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="estimatedHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="예상 시간"
                    type="number"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            {/* Row 5: Progress + Private */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <Controller
                name="doneRatio"
                control={control}
                render={({ field }) => (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      진행률: {field.value ?? 0}%
                    </Typography>
                    <Slider
                      value={field.value ?? 0}
                      onChange={(_, val) => field.onChange(val as number)}
                      step={10}
                      marks
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(val) => `${val}%`}
                    />
                  </Box>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name="isPrivate"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="비공개"
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>커스텀 필드</Typography>
              <Grid container spacing={2}>
                {customFields.map((cf) => (
                  <Grid key={cf.id} size={{ xs: 12, sm: 6 }}>
                    {renderCustomFieldInput(cf, customValues[cf.id ?? 0] ?? '', (val) =>
                      setCustomValues((prev) => ({ ...prev, [cf.id ?? 0]: val }))
                    )}
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button onClick={handleCancel}>취소</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {createMutation.isPending ? '생성 중...' : '이슈 생성'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
