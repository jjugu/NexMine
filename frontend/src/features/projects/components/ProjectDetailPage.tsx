import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Chip, Card, CardContent, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Alert, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Autocomplete, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BugReportIcon from '@mui/icons-material/BugReport';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDto, ProjectMemberDto, IssueDtoPagedResult, VersionDto } from '../../../api/generated/model';

function fetchProject(identifier: string) {
  return axiosInstance.get<ProjectDto>(`/Projects/${identifier}`).then((res) => res.data);
}

function fetchMembers(identifier: string) {
  return axiosInstance.get<ProjectMemberDto[]>(`/projects/${identifier}/members`).then((res) => res.data);
}

function fetchIssueStats(identifier: string) {
  return axiosInstance.get<IssueDtoPagedResult>(`/projects/${identifier}/issues`, { params: { PageSize: 1, Page: 1 } }).then((res) => res.data);
}

function fetchVersions(identifier: string) {
  return axiosInstance.get<VersionDto[]>(`/projects/${identifier}/versions`).then((res) => res.data);
}

export default function ProjectDetailPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string; email: string; displayName: string } | null>(null);
  const [newMemberRoleId, setNewMemberRoleId] = useState(2);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const userSearchQuery = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: () => axiosInstance.get(`/Users/search`, { params: { q: userSearch } }).then((r) => r.data as { id: number; username: string; email: string; displayName: string }[]),
    enabled: isAddMemberOpen,
    staleTime: 10_000,
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      axiosInstance.post(`/projects/${identifier}/members`, {
        userId: selectedUser!.id,
        roleId: newMemberRoleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', identifier] });
      setIsAddMemberOpen(false);
      setSelectedUser(null);
      setNewMemberRoleId(2);
      setAddMemberError(null);
      setUserSearch('');
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { detail?: string; title?: string } } };
      setAddMemberError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        '멤버 추가에 실패했습니다.',
      );
    },
  });

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
  });

  const membersQuery = useQuery({
    queryKey: ['project-members', identifier],
    queryFn: () => fetchMembers(identifier!),
    enabled: !!identifier,
  });

  const issueStatsQuery = useQuery({
    queryKey: ['issue-stats', identifier],
    queryFn: () => fetchIssueStats(identifier!),
    enabled: !!identifier,
  });

  const versionsQuery = useQuery({
    queryKey: ['versions', identifier],
    queryFn: () => fetchVersions(identifier!),
    enabled: !!identifier,
  });

  const project = projectQuery.data;
  const members = membersQuery.data ?? [];
  const totalIssues = issueStatsQuery.data?.totalCount ?? 0;
  const totalVersions = versionsQuery.data?.length ?? 0;

  function handleBack() {
    navigate('/projects');
  }

  if (projectQuery.isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (projectQuery.isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          프로젝트를 불러오는데 실패했습니다.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          프로젝트 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <Alert severity="warning">프로젝트를 찾을 수 없습니다.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          프로젝트 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small">
          목록
        </Button>
      </Box>

      {/* Project Info Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h5">{project.name}</Typography>
                {project.isPublic ? (
                  <Chip icon={<PublicIcon />} label="공개" size="small" color="success" variant="outlined" />
                ) : (
                  <Chip icon={<LockIcon />} label="비공개" size="small" variant="outlined" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                식별자: {project.identifier}
              </Typography>
              {project.description && (
                <Typography variant="body2" color="text.secondary">
                  {project.description}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick stats / navigation */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
            onClick={() => navigate(`/projects/${identifier}/issues`)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BugReportIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalIssues}</Typography>
                <Typography variant="body2" color="text.secondary">이슈</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
            onClick={() => navigate(`/projects/${identifier}/versions`)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NewReleasesIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalVersions}</Typography>
                <Typography variant="body2" color="text.secondary">버전</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">멤버</Typography>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            size="small"
            onClick={() => { setAddMemberError(null); setIsAddMemberOpen(true); }}
          >
            멤버 추가
          </Button>
        </Box>

        {membersQuery.isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        )}

        {membersQuery.isError && (
          <Alert severity="error">멤버 목록을 불러오는데 실패했습니다.</Alert>
        )}

        {!membersQuery.isLoading && !membersQuery.isError && members.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            등록된 멤버가 없습니다.
          </Typography>
        )}

        {!membersQuery.isLoading && !membersQuery.isError && members.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>사용자</TableCell>
                  <TableCell>역할</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>
                      <Chip label={member.roleName ?? '멤버'} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>멤버 추가</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {addMemberError && <Alert severity="error">{addMemberError}</Alert>}
          <Autocomplete
            options={userSearchQuery.data ?? []}
            getOptionLabel={(option) => `${option.displayName} (${option.username})`}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">{option.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">@{option.username} · {option.email}</Typography>
                </Box>
              </li>
            )}
            value={selectedUser}
            onChange={(_, value) => setSelectedUser(value)}
            onInputChange={(_, value) => setUserSearch(value)}
            loading={userSearchQuery.isLoading}
            noOptionsText="사용자를 찾을 수 없습니다"
            loadingText="검색 중..."
            renderInput={(params) => (
              <TextField
                {...params}
                label="사용자 검색"
                placeholder="이름, 아이디, 이메일로 검색"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {userSearchQuery.isLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          <FormControl fullWidth>
            <InputLabel>역할</InputLabel>
            <Select
              value={newMemberRoleId}
              label="역할"
              onChange={(e) => setNewMemberRoleId(Number(e.target.value))}
            >
              <MenuItem value={1}>Manager</MenuItem>
              <MenuItem value={2}>Developer</MenuItem>
              <MenuItem value={3}>Reporter</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAddMemberOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={() => addMemberMutation.mutate()}
            disabled={!selectedUser || addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? '추가 중...' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
