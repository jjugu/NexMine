import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Chip, Card, CardContent, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Alert, Tabs, Tab, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDto, ProjectMemberDto } from '../../../api/generated/model';

function fetchProject(identifier: string) {
  return axiosInstance.get<ProjectDto>(`/Projects/${identifier}`).then((res) => res.data);
}

function fetchMembers(identifier: string) {
  return axiosInstance.get<ProjectMemberDto[]>(`/projects/${identifier}/members`).then((res) => res.data);
}

const tabItems = [
  { label: '이슈', value: 'issues' },
  { label: '칸반', value: 'kanban' },
  { label: '간트', value: 'gantt' },
  { label: '캘린더', value: 'calendar' },
  { label: '위키', value: 'wiki' },
  { label: '문서', value: 'documents' },
  { label: '설정', value: 'settings' },
];

export default function ProjectDetailPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

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

  const project = projectQuery.data;
  const members = membersQuery.data ?? [];

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

      {/* Tabs (placeholder) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={false} variant="scrollable" scrollButtons="auto">
          {tabItems.map((tab) => (
            <Tab key={tab.value} label={tab.label} disabled />
          ))}
        </Tabs>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        하위 기능은 이후 단계에서 구현됩니다.
      </Typography>

      {/* Members */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">멤버</Typography>
          <Button variant="outlined" startIcon={<PersonAddIcon />} size="small" disabled>
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
    </Box>
  );
}
