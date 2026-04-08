import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Alert, Chip, Grid,
  CircularProgress, Skeleton, Breadcrumbs, Link, Paper, Divider,
  MenuItem, Select, FormControl, InputLabel, Slider,
  FormControlLabel, Switch, Avatar, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox,
  Snackbar, Autocomplete, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axiosInstance from '../../../api/axiosInstance';
import { useSignalR } from '../../../hooks/useSignalR';
import { useAuthStore } from '../../../stores/authStore';
import type {
  IssueDetailDto, ProjectDto, JournalDto, TimeEntryDto, CustomFieldDto,
  AllowedStatusDto, WatcherDto, ProjectMemberDto,
} from '../../../api/generated/model';
import CopyIssueDialog from './CopyIssueDialog';
import MoveIssueDialog from './MoveIssueDialog';
import {
  useTrackers, useIssueStatuses, useIssuePriorities,
  useCategories, useVersions, useProjectMembers,
} from '../hooks/useReferenceData';
import {
  formatDate, formatDateTime, getPriorityColor,
  PROPERTY_NAME_LABELS, ACTIVITY_TYPE_LABELS,
} from '../utils/issueUtils';

// ---------- schemas ----------
const updateIssueSchema = z.object({
  trackerId: z.number().optional().nullable(),
  subject: z.string().min(1, '제목을 입력해주세요').max(255),
  description: z.string().optional().nullable(),
  statusId: z.number().optional().nullable(),
  priorityId: z.number().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  categoryId: z.number().optional().nullable(),
  versionId: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  doneRatio: z.number().min(0).max(100).optional().nullable(),
  isPrivate: z.boolean().optional().nullable(),
});

type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;

// ---------- fetch helpers ----------
function fetchIssue(id: number) {
  return axiosInstance.get<IssueDetailDto>(`/Issues/${id}`).then((r) => r.data);
}

function fetchProject(identifier: string) {
  return axiosInstance.get<ProjectDto>(`/Projects/${identifier}`).then((r) => r.data);
}

function fetchJournals(issueId: number) {
  return axiosInstance.get<JournalDto[]>(`/issues/${issueId}/journals`).then((r) => r.data);
}

function fetchTimeEntries(issueId: number) {
  return axiosInstance.get(`/issues/${issueId}/time-entries`).then((r) => {
    const data = r.data;
    // API returns paginated { items, totalCount } or plain array
    return Array.isArray(data) ? data as TimeEntryDto[] : (data.items ?? []) as TimeEntryDto[];
  });
}

// ---------- custom field helpers ----------
const FIELD_FORMAT_LABELS: Record<number, string> = {
  0: '텍스트', 1: '장문 텍스트', 2: '정수', 3: '실수',
  4: '날짜', 5: '불린', 6: '목록', 7: '링크',
};

function renderCustomFieldInput(
  cf: CustomFieldDto,
  value: string,
  onChange: (val: string) => void,
) {
  const label = cf.isRequired ? `${cf.name} *` : (cf.name ?? '');
  const fieldFormat = cf.fieldFormat ?? 0;

  switch (fieldFormat) {
    case 0: // String
      return <TextField label={label} fullWidth size="small" value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} />;
    case 1: // Text
      return <TextField label={label} fullWidth size="small" multiline rows={3} value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} />;
    case 2: // Int
      return <TextField label={label} fullWidth size="small" type="number" slotProps={{ htmlInput: { step: 1 } }} value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} />;
    case 3: // Float
      return <TextField label={label} fullWidth size="small" type="number" slotProps={{ htmlInput: { step: 0.01 } }} value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} />;
    case 4: // Date
      return <TextField label={label} fullWidth size="small" type="date" value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} slotProps={{ inputLabel: { shrink: true } }} />;
    case 5: // Bool
      return <FormControlLabel control={<Checkbox checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />} label={cf.name ?? ''} />;
    case 6: // List
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{label}</InputLabel>
          <Select value={value} label={label} onChange={(e) => onChange(e.target.value)} required={cf.isRequired}>
            <MenuItem value="">없음</MenuItem>
            {(cf.possibleValues ?? []).map((pv) => (<MenuItem key={pv} value={pv}>{pv}</MenuItem>))}
          </Select>
        </FormControl>
      );
    case 7: // Link
      return <TextField label={label} fullWidth size="small" type="url" placeholder="https://" value={value} onChange={(e) => onChange(e.target.value)} required={cf.isRequired} />;
    default:
      return <TextField label={label} fullWidth size="small" value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}

function formatCustomValue(value: string | null | undefined, fieldFormat: number): React.ReactNode {
  if (!value) return '-';
  switch (fieldFormat) {
    case 5: // Bool
      return value === 'true' ? '예' : '아니오';
    case 4: // Date
      return formatDate(value);
    case 7: // Link
      return (
        <Link href={value} target="_blank" rel="noopener noreferrer" underline="hover">
          {value}
        </Link>
      );
    default:
      return value;
  }
}

// ---------- sub-components ----------
function JournalTimeline({ issueId }: { issueId: number }) {
  const journalsQuery = useQuery({
    queryKey: ['journals', issueId],
    queryFn: () => fetchJournals(issueId),
    enabled: !!issueId,
  });

  const journals = journalsQuery.data ?? [];

  if (journalsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (journals.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        활동 기록이 없습니다.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {journals.map((journal) => (
        <Paper key={journal.id} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
              {(journal.userName ?? '?')[0].toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {journal.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(journal.createdAt)}
            </Typography>
          </Box>

          {/* Field changes */}
          {journal.details && journal.details.length > 0 && (
            <Box sx={{ mb: journal.notes ? 1 : 0, pl: 4.5 }}>
              {journal.details.map((detail, idx) => (
                <Typography key={idx} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {PROPERTY_NAME_LABELS[detail.propertyName ?? ''] ?? detail.propertyName}
                  {'\u00A0'}
                  {detail.oldValue ? (
                    <>
                      <Box component="span" sx={{ textDecoration: 'line-through', color: 'error.main' }}>
                        {detail.oldValue}
                      </Box>
                      {' \u2192 '}
                    </>
                  ) : (
                    <>{' 설정: '}</>
                  )}
                  <Box component="span" sx={{ fontWeight: 500, color: 'success.main' }}>
                    {detail.newValue ?? '(없음)'}
                  </Box>
                </Typography>
              ))}
            </Box>
          )}

          {/* Comment */}
          {journal.notes && (
            <Box sx={{ pl: 4.5 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {journal.notes}
              </Typography>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}

function CommentForm({ issueId }: { issueId: number }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (text: string) =>
      axiosInstance.post(`/issues/${issueId}/journals`, { notes: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', issueId] });
      setNotes('');
      setError(null);
    },
    onError: () => {
      setError('댓글 추가에 실패했습니다.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) return;
    addMutation.mutate(notes.trim());
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <TextField
        placeholder="댓글을 입력하세요..."
        multiline
        rows={3}
        fullWidth
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={!notes.trim() || addMutation.isPending}
          startIcon={addMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          댓글 추가
        </Button>
      </Box>
    </Box>
  );
}

function TimeEntrySection({ issueId, projectId }: { issueId: number; projectId: number }) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hours, setHours] = useState('');
  const [spentOn, setSpentOn] = useState(new Date().toISOString().split('T')[0]);
  const [activityType, setActivityType] = useState(1);
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const timeEntriesQuery = useQuery({
    queryKey: ['time-entries', issueId],
    queryFn: () => fetchTimeEntries(issueId),
    enabled: !!issueId,
  });

  const entries = timeEntriesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      axiosInstance.post('/time-entries', {
        projectId,
        issueId,
        hours: Number(hours),
        spentOn,
        activityType,
        comments: comments || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', issueId] });
      handleResetForm();
    },
    onError: () => setError('시간 기록 추가에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) =>
      axiosInstance.put(`/time-entries/${id}`, {
        hours: Number(hours),
        spentOn,
        activityType,
        comments: comments || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', issueId] });
      handleResetForm();
    },
    onError: () => setError('시간 기록 수정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', issueId] });
    },
  });

  function handleResetForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setHours('');
    setSpentOn(new Date().toISOString().split('T')[0]);
    setActivityType(1);
    setComments('');
    setError(null);
  }

  function handleEdit(entry: TimeEntryDto) {
    setEditingId(entry.id ?? null);
    setHours(String(entry.hours ?? ''));
    setSpentOn(entry.spentOn ?? new Date().toISOString().split('T')[0]);
    setActivityType(entry.activityType ?? 1);
    setComments(entry.comments ?? '');
    setIsFormOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || Number(hours) <= 0) return;
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          시간 기록 {totalHours > 0 && `(합계: ${totalHours.toFixed(1)}h)`}
        </Typography>
        {!isFormOpen && (
          <Button size="small" onClick={() => setIsFormOpen(true)}>
            기록 추가
          </Button>
        )}
      </Box>

      {timeEntriesQuery.isLoading && (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
      )}

      {entries.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
          {entries.map((entry) => (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                px: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 50 }}>
                {entry.hours}h
              </Typography>
              <Chip
                label={ACTIVITY_TYPE_LABELS[entry.activityType ?? 0] ?? '기타'}
                size="small"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {entry.comments ?? ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.userName} &middot; {formatDate(entry.spentOn)}
              </Typography>
              <IconButton size="small" onClick={() => handleEdit(entry)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => entry.id && deleteMutation.mutate(entry.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {entries.length === 0 && !timeEntriesQuery.isLoading && !isFormOpen && (
        <Typography variant="body2" color="text.secondary">
          기록된 시간이 없습니다.
        </Typography>
      )}

      {isFormOpen && (
        <Paper variant="outlined" sx={{ p: 1.5, mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleFormSubmit}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="시간"
                  type="number"
                  fullWidth
                  size="small"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <DatePicker
                  label="날짜"
                  value={spentOn ? dayjs(spentOn) : null}
                  onChange={(val) => setSpentOn(val ? val.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  format="YYYY-MM-DD"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>활동</InputLabel>
                  <Select
                    value={activityType}
                    label="활동"
                    onChange={(e) => setActivityType(Number(e.target.value))}
                  >
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([val, label]) => (
                      <MenuItem key={val} value={Number(val)}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="설명"
                  fullWidth
                  size="small"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button size="small" onClick={handleResetForm}>취소</Button>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? '수정' : '추가'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

// ---------- watcher section ----------
function WatcherSection({ issueId, members }: { issueId: number; members: ProjectMemberDto[] }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch watcher list
  const watchersQuery = useQuery({
    queryKey: ['watchers', issueId],
    queryFn: () =>
      axiosInstance.get<WatcherDto[]>(`/issues/${issueId}/watchers`).then((r) => r.data),
    enabled: !!issueId,
  });

  // Fetch my watch status
  const watchStatusQuery = useQuery<{ isWatching: boolean }>({
    queryKey: ['watchers', issueId, 'me'],
    queryFn: () =>
      axiosInstance.get(`/issues/${issueId}/watchers/me`).then((r) => r.data),
    enabled: !!issueId,
  });

  const watchers = watchersQuery.data ?? [];
  const isWatching = watchStatusQuery.data?.isWatching ?? false;

  // Toggle my watch
  const toggleWatchMutation = useMutation({
    mutationFn: () =>
      isWatching
        ? axiosInstance.delete(`/issues/${issueId}/watchers/me`)
        : axiosInstance.post(`/issues/${issueId}/watchers/me`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchers', issueId] });
    },
  });

  // Add watcher
  const addWatcherMutation = useMutation({
    mutationFn: (userId: number) =>
      axiosInstance.post(`/issues/${issueId}/watchers`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchers', issueId] });
      setIsAddOpen(false);
    },
  });

  // Remove watcher
  const removeWatcherMutation = useMutation({
    mutationFn: (userId: number) =>
      axiosInstance.delete(`/issues/${issueId}/watchers/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchers', issueId] });
    },
  });

  // Filter out members already watching
  const watcherUserIds = new Set(watchers.map((w) => w.userId));
  const addableMembers = members.filter((m) => !watcherUserIds.has(m.userId));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          감시자 ({watchers.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isWatching ? '감시 해제' : '감시하기'}>
            <IconButton
              size="small"
              onClick={() => toggleWatchMutation.mutate()}
              disabled={toggleWatchMutation.isPending}
              color={isWatching ? 'primary' : 'default'}
            >
              {isWatching ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="감시자 추가">
            <IconButton size="small" onClick={() => setIsAddOpen(true)}>
              <PersonAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {watchersQuery.isLoading && (
        <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} />
      )}

      {watchers.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {watchers.map((watcher) => (
            <Chip
              key={watcher.userId}
              label={watcher.userName ?? ''}
              size="small"
              variant="outlined"
              avatar={
                <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>
                  {(watcher.userName ?? '?')[0].toUpperCase()}
                </Avatar>
              }
              onDelete={() =>
                watcher.userId != null && removeWatcherMutation.mutate(watcher.userId)
              }
            />
          ))}
        </Box>
      ) : (
        !watchersQuery.isLoading && (
          <Typography variant="body2" color="text.secondary">
            감시자가 없습니다.
          </Typography>
        )
      )}

      {/* Add watcher dialog */}
      {isAddOpen && (
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            size="small"
            options={addableMembers}
            getOptionLabel={(option) => option.username ?? ''}
            renderOption={(props, option) => (
              <li {...props} key={option.userId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                    {(option.username ?? '?')[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">{option.username}</Typography>
                </Box>
              </li>
            )}
            onChange={(_, value) => {
              if (value?.userId != null) {
                addWatcherMutation.mutate(value.userId);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="멤버 검색"
                placeholder="감시자로 추가할 멤버를 선택하세요"
                autoFocus
              />
            )}
            noOptionsText="추가 가능한 멤버가 없습니다"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Button size="small" onClick={() => setIsAddOpen(false)}>
              닫기
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ---------- main component ----------
export default function IssueDetailPage() {
  const { identifier, id } = useParams<{ identifier: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const issueId = Number(id);

  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [editCustomValues, setEditCustomValues] = useState<Record<number, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // --- SignalR realtime collaboration ---
  const { isConnected, on, invoke } = useSignalR();
  const currentUser = useAuthStore((s) => s.user);

  interface ActiveUser {
    userId: number;
    userName: string;
    connectionId: string;
  }

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [editingUsers, setEditingUsers] = useState<string[]>([]);
  const [remoteChangeAlert, setRemoteChangeAlert] = useState<string | null>(null);

  // Join/Leave issue room on mount/unmount
  useEffect(() => {
    if (!isConnected || !issueId) return;
    invoke('JoinIssue', issueId);
    return () => {
      invoke('LeaveIssue', issueId);
    };
  }, [isConnected, issueId, invoke]);

  // Notify editing state to other users
  const notifyEditingStart = useCallback(() => {
    if (isConnected && issueId) {
      invoke('StartEditingIssue', issueId);
    }
  }, [isConnected, issueId, invoke]);

  const notifyEditingStop = useCallback(() => {
    if (isConnected && issueId) {
      invoke('StopEditingIssue', issueId);
    }
  }, [isConnected, issueId, invoke]);

  // Listen for SignalR events related to issue collaboration
  useEffect(() => {
    if (!isConnected) return;

    const unsubJoined = on('UserJoinedIssue', (...args: unknown[]) => {
      const data = args[0] as { issueId: number; userId: number; userName: string; connectionId: string };
      if (data.issueId !== issueId) return;
      setActiveUsers((prev) => {
        if (prev.some((u) => u.connectionId === data.connectionId)) return prev;
        return [...prev, { userId: data.userId, userName: data.userName, connectionId: data.connectionId }];
      });
    });

    const unsubLeft = on('UserLeftIssue', (...args: unknown[]) => {
      const data = args[0] as { issueId: number; userId: number; userName: string; connectionId: string };
      if (data.issueId !== issueId) return;
      setActiveUsers((prev) => prev.filter((u) => u.connectionId !== data.connectionId));
      // Also remove from editing users if they left
      setEditingUsers((prev) => prev.filter((name) => name !== data.userName));
    });

    const unsubStartedEditing = on('UserStartedEditing', (...args: unknown[]) => {
      const data = args[0] as { issueId: number; userId: number; userName: string };
      if (data.issueId !== issueId) return;
      if (data.userName === currentUser?.username) return;
      setEditingUsers((prev) => {
        if (prev.includes(data.userName)) return prev;
        return [...prev, data.userName];
      });
    });

    const unsubStoppedEditing = on('UserStoppedEditing', (...args: unknown[]) => {
      const data = args[0] as { issueId: number; userId: number; userName: string };
      if (data.issueId !== issueId) return;
      setEditingUsers((prev) => prev.filter((name) => name !== data.userName));
    });

    const unsubChanged = on('IssueChanged', (...args: unknown[]) => {
      const data = args[0] as { issueId: number; userName: string };
      if (data.issueId !== issueId) return;
      if (data.userName === currentUser?.username) return;
      setRemoteChangeAlert(data.userName);
    });

    return () => {
      unsubJoined();
      unsubLeft();
      unsubStartedEditing();
      unsubStoppedEditing();
      unsubChanged();
    };
  }, [isConnected, on, issueId, currentUser?.username]);

  // Reference data
  const trackersQuery = useTrackers();
  const statusesQuery = useIssueStatuses();
  const prioritiesQuery = useIssuePriorities();
  const categoriesQuery = useCategories(identifier);
  const versionsQuery = useVersions(identifier);
  const membersQuery = useProjectMembers(identifier);

  const trackers = trackersQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const priorities = prioritiesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const versions = versionsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  // Allowed statuses for workflow-based status dropdown
  const allowedStatusesQuery = useQuery({
    queryKey: ['allowed-statuses', issueId],
    queryFn: () =>
      axiosInstance.get<AllowedStatusDto[]>(`/issues/${issueId}/allowed-statuses`).then((r) => r.data),
    enabled: !!issueId,
  });
  // Use allowed statuses if available (non-empty), otherwise fall back to all statuses
  const editableStatuses = allowedStatusesQuery.data && allowedStatusesQuery.data.length > 0
    ? allowedStatusesQuery.data.map((s) => ({ id: s.id!, name: s.name ?? '' }))
    : statuses;

  // Issue data
  const issueQuery = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => fetchIssue(issueId),
    enabled: !!issueId,
  });

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

  const customFields = customFieldsQuery.data ?? [];

  const issue = issueQuery.data;

  // Edit form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateIssueFormData>({
    resolver: zodResolver(updateIssueSchema),
    values: issue
      ? {
          trackerId: issue.trackerId,
          subject: issue.subject ?? '',
          description: issue.description ?? '',
          statusId: issue.statusId,
          priorityId: issue.priorityId,
          assignedToId: issue.assignedToId ?? null,
          categoryId: issue.categoryId ?? null,
          versionId: issue.versionId ?? null,
          startDate: issue.startDate ?? null,
          dueDate: issue.dueDate ?? null,
          estimatedHours: issue.estimatedHours ?? null,
          doneRatio: issue.doneRatio ?? 0,
          isPrivate: issue.isPrivate ?? false,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateIssueFormData) => {
      const customValuesPayload = Object.entries(editCustomValues)
        .filter(([, v]) => v !== '')
        .map(([fieldId, value]) => ({ customFieldId: Number(fieldId), value }));
      const payload = {
        ...data,
        assignedToId: data.assignedToId || null,
        categoryId: data.categoryId || null,
        versionId: data.versionId || null,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        estimatedHours: data.estimatedHours || null,
        customValues: customValuesPayload.length > 0 ? customValuesPayload : undefined,
      };
      return axiosInstance.put(`/Issues/${issueId}`, payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['journals', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', identifier] });
      setIsEditing(false);
      setServerError(null);
      notifyEditingStop();
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setServerError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '이슈 수정에 실패했습니다.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axiosInstance.delete(`/Issues/${issueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', identifier] });
      navigate(`/projects/${identifier}/issues`);
    },
  });

  function handleEdit() {
    // Initialize custom field values from current issue data
    const cvMap: Record<number, string> = {};
    if (issue?.customValues) {
      for (const cv of issue.customValues) {
        if (cv.customFieldId != null) {
          cvMap[cv.customFieldId] = cv.value ?? '';
        }
      }
    }
    setEditCustomValues(cvMap);
    setIsEditing(true);
    setServerError(null);
    notifyEditingStart();
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setServerError(null);
    reset();
    notifyEditingStop();
  }

  function handleFormSubmit(data: UpdateIssueFormData) {
    setServerError(null);
    updateMutation.mutate(data);
  }

  function handleDelete() {
    setIsDeleteOpen(false);
    deleteMutation.mutate();
  }

  async function handleExportPdf() {
    if (!issueId) return;
    setIsExportingPdf(true);
    try {
      const response = await axiosInstance.get(
        `/issues/${issueId}/export/pdf`,
        { responseType: 'blob' },
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `issue_${issueId}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      setSnackbar({ open: true, message: 'PDF 내보내기에 실패했습니다.', severity: 'error' });
    } finally {
      setIsExportingPdf(false);
    }
  }

  // Loading
  if (issueQuery.isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  // Error
  if (issueQuery.isError || !issue) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          이슈를 불러오는데 실패했습니다.
        </Alert>
        <Button onClick={() => navigate(`/projects/${identifier}/issues`)}>
          이슈 목록으로 돌아가기
        </Button>
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
        <Typography color="text.primary">#{issue.id}</Typography>
      </Breadcrumbs>

      {/* Active users viewing this issue */}
      {activeUsers.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            현재 조회 중:
          </Typography>
          {activeUsers
            .filter((u) => u.userName !== currentUser?.username)
            .map((u) => (
              <Chip
                key={u.connectionId}
                label={u.userName}
                size="small"
                variant="outlined"
                avatar={
                  <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                    {u.userName[0].toUpperCase()}
                  </Avatar>
                }
              />
            ))}
        </Box>
      )}

      {/* Remote editing warning */}
      {editingUsers.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {editingUsers.join(', ')}님이 이 이슈를 편집 중입니다
        </Alert>
      )}

      {/* Remote change alert */}
      {remoteChangeAlert && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
                queryClient.invalidateQueries({ queryKey: ['journals', issueId] });
                setRemoteChangeAlert(null);
              }}
            >
              새로고침
            </Button>
          }
        >
          이 이슈가 {remoteChangeAlert}님에 의해 수정되었습니다. 새로고침하시겠습니까?
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {!isEditing ? (
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={issue.trackerName ?? '트래커'} size="small" variant="outlined" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                #{issue.id} {issue.subject}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            #{issue.id} 이슈 수정
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {!isEditing ? (
            <>
              <Tooltip title="PDF">
                <span>
                  <IconButton onClick={handleExportPdf} disabled={isExportingPdf}>
                    {isExportingPdf ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="복사">
                <IconButton onClick={() => setIsCopyOpen(true)}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="이동">
                <IconButton onClick={() => setIsMoveOpen(true)}>
                  <DriveFileMoveIcon />
                </IconButton>
              </Tooltip>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
                수정
              </Button>
              <IconButton color="error" onClick={() => setIsDeleteOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </>
          ) : (
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleCancelEdit}>
              취소
            </Button>
          )}
        </Box>
      </Box>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {/* Edit form or read-only detail */}
      {isEditing ? (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller
                  name="trackerId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>트래커</InputLabel>
                      <Select
                        value={field.value ?? ''}
                        label="트래커"
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
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="설명"
                  fullWidth
                  multiline
                  rows={4}
                  {...register('description')}
                />
              </Grid>
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
                        {editableStatuses.map((s) => (
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
                          checked={field.value ?? false}
                          onChange={field.onChange}
                        />
                      }
                      label="비공개"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Custom Fields in edit mode */}
            {customFields.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>커스텀 필드</Typography>
                <Grid container spacing={2}>
                  {customFields.map((cf) => (
                    <Grid key={cf.id} size={{ xs: 12, sm: 6 }}>
                      {renderCustomFieldInput(cf, editCustomValues[cf.id ?? 0] ?? '', (val) =>
                        setEditCustomValues((prev) => ({ ...prev, [cf.id ?? 0]: val }))
                      )}
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={handleCancelEdit}>취소</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateMutation.isPending}
                startIcon={
                  updateMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
              >
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            </Box>
          </form>
        </Paper>
      ) : (
        <>
          {/* Read-only detail */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">상태</Typography>
                <Box>
                  <Chip label={issue.statusName ?? '-'} size="small" color="success" variant="outlined" />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">우선순위</Typography>
                <Box>
                  <Chip
                    label={issue.priorityName ?? '-'}
                    size="small"
                    color={getPriorityColor(issue.priorityName)}
                    variant="outlined"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">담당자</Typography>
                <Typography variant="body2">{issue.assignedToName ?? '미배정'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">작성자</Typography>
                <Typography variant="body2">{issue.authorName ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">카테고리</Typography>
                <Typography variant="body2">{issue.categoryName ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">대상 버전</Typography>
                <Typography variant="body2">{issue.versionName ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">시작일</Typography>
                <Typography variant="body2">{formatDate(issue.startDate)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">종료일</Typography>
                <Typography variant="body2">{formatDate(issue.dueDate)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">예상 시간</Typography>
                <Typography variant="body2">
                  {issue.estimatedHours != null ? `${issue.estimatedHours}h` : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">진행률</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={issue.doneRatio ?? 0}
                    sx={{ flex: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="body2">{issue.doneRatio ?? 0}%</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">생성일</Typography>
                <Typography variant="body2">{formatDateTime(issue.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">갱신일</Typography>
                <Typography variant="body2">{formatDateTime(issue.updatedAt)}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Description */}
          {issue.description && (
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>설명</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {issue.description}
              </Typography>
            </Paper>
          )}

          {/* Custom Fields (read-only) */}
          {issue.customValues && issue.customValues.length > 0 && (
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>커스텀 필드</Typography>
              <Grid container spacing={2}>
                {issue.customValues.map((cv) => {
                  const cfDef = customFields.find((cf) => cf.id === cv.customFieldId);
                  const fieldFormat = cfDef?.fieldFormat ?? 0;
                  return (
                    <Grid key={cv.customFieldId} size={{ xs: 6, sm: 4, md: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        {cv.customFieldName ?? FIELD_FORMAT_LABELS[fieldFormat] ?? ''}
                      </Typography>
                      <Typography variant="body2" component="div">
                        {formatCustomValue(cv.value, fieldFormat)}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          )}
        </>
      )}

      {/* Watchers */}
      {!isEditing && (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
          <WatcherSection issueId={issueId} members={members} />
        </Paper>
      )}

      {/* Time Entries */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 3 }}>
        <TimeEntrySection issueId={issueId} projectId={issue.projectId ?? 0} />
      </Paper>

      {/* Activity / Journals */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>활동</Typography>
        <Divider sx={{ mb: 2 }} />
        <JournalTimeline issueId={issueId} />
        <CommentForm issueId={issueId} />
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogTitle>이슈 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            이슈 #{issue.id} &quot;{issue.subject}&quot;를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>취소</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy issue dialog */}
      <CopyIssueDialog
        open={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        issueId={issueId}
        currentProjectId={issue.projectId ?? 0}
        currentProjectIdentifier={identifier ?? ''}
        onSuccess={(message) => setSnackbar({ open: true, message, severity: 'success' })}
      />

      {/* Move issue dialog */}
      <MoveIssueDialog
        open={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        issueId={issueId}
        currentProjectId={issue.projectId ?? 0}
        currentProjectIdentifier={identifier ?? ''}
        onSuccess={(message) => setSnackbar({ open: true, message, severity: 'success' })}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
