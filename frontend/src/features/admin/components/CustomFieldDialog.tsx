import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Alert, FormControl, InputLabel,
  Select, MenuItem, FormControlLabel, Switch, Chip,
  Typography, CircularProgress,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import type { CustomFieldDto, ProjectDto, ProjectDtoPagedResult, TrackerDto } from '../../../api/generated/model';

const FIELD_FORMAT_LABELS: Record<number, string> = {
  0: '텍스트',
  1: '장문 텍스트',
  2: '정수',
  3: '실수',
  4: '날짜',
  5: '불린',
  6: '목록',
  7: '링크',
};

const CUSTOMIZABLE_LABELS: Record<string, string> = {
  issue: '이슈',
  project: '프로젝트',
  user: '사용자',
};

interface CustomFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editField: CustomFieldDto | null;
}

export default function CustomFieldDialog({ open, onClose, onSaved, editField }: CustomFieldDialogProps) {
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [fieldFormat, setFieldFormat] = useState(0);
  const [customizable, setCustomizable] = useState('issue');
  const [isRequired, setIsRequired] = useState(false);
  const [isForAll, setIsForAll] = useState(true);
  const [isFilter, setIsFilter] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [description, setDescription] = useState('');
  const [possibleValuesText, setPossibleValuesText] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [selectedTrackerIds, setSelectedTrackerIds] = useState<number[]>([]);

  // Reference data
  const projectsQuery = useQuery({
    queryKey: ['all-projects'],
    queryFn: () => axiosInstance.get<ProjectDtoPagedResult>('/projects', { params: { pageSize: 100 } }).then((r) => {
      const data = r.data;
      return (data.items ?? []) as ProjectDto[];
    }),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const trackersQuery = useQuery({
    queryKey: ['admin-trackers'],
    queryFn: () => axiosInstance.get<TrackerDto[]>('/admin/trackers').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const projects = projectsQuery.data ?? [];
  const trackers = trackersQuery.data ?? [];

  // Initialize form when dialog opens or editField changes
  useEffect(() => {
    if (open) {
      if (editField) {
        setName(editField.name ?? '');
        setFieldFormat(editField.fieldFormat ?? 0);
        setCustomizable(editField.customizable ?? 'issue');
        setIsRequired(editField.isRequired ?? false);
        setIsForAll(editField.isForAll ?? true);
        setIsFilter(editField.isFilter ?? false);
        setDefaultValue(editField.defaultValue ?? '');
        setDescription(editField.description ?? '');
        setPossibleValuesText((editField.possibleValues ?? []).join('\n'));
        setSelectedProjectIds(editField.projectIds ?? []);
        setSelectedTrackerIds(editField.trackerIds ?? []);
      } else {
        setName('');
        setFieldFormat(0);
        setCustomizable('issue');
        setIsRequired(false);
        setIsForAll(true);
        setIsFilter(false);
        setDefaultValue('');
        setDescription('');
        setPossibleValuesText('');
        setSelectedProjectIds([]);
        setSelectedTrackerIds([]);
      }
      setFormError('');
    }
  }, [open, editField]);

  async function handleSave() {
    if (!name.trim()) {
      setFormError('이름을 입력해주세요.');
      return;
    }

    const possibleValues = fieldFormat === 6
      ? possibleValuesText.split(/[\n,]/).map((v) => v.trim()).filter(Boolean)
      : undefined;

    const payload = {
      name: name.trim(),
      fieldFormat,
      customizable,
      isRequired,
      isForAll,
      isFilter,
      defaultValue: defaultValue || undefined,
      description: description || undefined,
      possibleValues: possibleValues ?? undefined,
      projectIds: isForAll ? [] : selectedProjectIds,
      trackerIds: customizable === 'issue' ? selectedTrackerIds : [],
    };

    setSaving(true);
    setFormError('');
    try {
      if (editField?.id) {
        await axiosInstance.put(`/admin/custom-fields/${editField.id}`, payload);
      } else {
        await axiosInstance.post('/admin/custom-fields', payload);
      }
      onSaved();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string; message?: string } } };
      setFormError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        axiosError.response?.data?.message ||
        '커스텀 필드 저장에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editField ? '커스텀 필드 수정' : '새 커스텀 필드'}</DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="이름"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth size="small">
            <InputLabel>유형</InputLabel>
            <Select
              value={fieldFormat}
              label="유형"
              onChange={(e) => setFieldFormat(Number(e.target.value))}
            >
              {Object.entries(FIELD_FORMAT_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={Number(val)}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>대상</InputLabel>
            <Select
              value={customizable}
              label="대상"
              onChange={(e) => setCustomizable(e.target.value)}
            >
              {Object.entries(CUSTOMIZABLE_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />}
              label="필수"
            />
            <FormControlLabel
              control={<Switch checked={isForAll} onChange={(e) => setIsForAll(e.target.checked)} />}
              label="전체 프로젝트 적용"
            />
            <FormControlLabel
              control={<Switch checked={isFilter} onChange={(e) => setIsFilter(e.target.checked)} />}
              label="필터 가능"
            />
          </Box>

          <TextField
            label="기본값"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            fullWidth
          />

          <TextField
            label="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          {/* Possible values - only for List type */}
          {fieldFormat === 6 && (
            <Box>
              <TextField
                label="선택 항목 (줄바꿈 또는 쉼표로 구분)"
                value={possibleValuesText}
                onChange={(e) => setPossibleValuesText(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              {possibleValuesText.trim() && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {possibleValuesText.split(/[\n,]/).map((v) => v.trim()).filter(Boolean).map((val, i) => (
                    <Chip key={i} label={val} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Project selection - only when isForAll=false */}
          {!isForAll && (
            <FormControl fullWidth size="small">
              <InputLabel>프로젝트</InputLabel>
              <Select
                multiple
                value={selectedProjectIds}
                label="프로젝트"
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProjectIds(typeof val === 'string' ? [] : val as number[]);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return <Chip key={id} label={project?.name ?? String(id)} size="small" />;
                    })}
                  </Box>
                )}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
              {projects.length === 0 && !projectsQuery.isLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  등록된 프로젝트가 없습니다.
                </Typography>
              )}
            </FormControl>
          )}

          {/* Tracker selection - only when customizable=issue */}
          {customizable === 'issue' && (
            <FormControl fullWidth size="small">
              <InputLabel>트래커</InputLabel>
              <Select
                multiple
                value={selectedTrackerIds}
                label="트래커"
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTrackerIds(typeof val === 'string' ? [] : val as number[]);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((id) => {
                      const tracker = trackers.find((t) => t.id === id);
                      return <Chip key={id} label={tracker?.name ?? String(id)} size="small" />;
                    })}
                  </Box>
                )}
              >
                {trackers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                비어있으면 모든 트래커에 적용됩니다.
              </Typography>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          disabled={!name.trim() || saving}
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
