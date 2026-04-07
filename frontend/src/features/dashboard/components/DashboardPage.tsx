import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Skeleton, Alert, Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BugReportIcon from '@mui/icons-material/BugReport';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import ScheduleIcon from '@mui/icons-material/Schedule';
import axiosInstance from '../../../api/axiosInstance';
import type {
  ProjectDtoPagedResult,
  ProjectDto,
  ProjectMemberDto,
  IssueDtoPagedResult,
} from '../../../api/generated/model';

interface ProjectStats {
  project: ProjectDto;
  issueCount: number;
  memberCount: number;
}

function fetchProjects() {
  return axiosInstance
    .get<ProjectDtoPagedResult>('/Projects', { params: { page: 1, pageSize: 50 } })
    .then((r) => r.data);
}

function fetchProjectIssueCount(identifier: string) {
  return axiosInstance
    .get<IssueDtoPagedResult>(`/projects/${identifier}/issues`, {
      params: { Page: 1, PageSize: 1 },
    })
    .then((r) => r.data.totalCount ?? 0);
}

function fetchProjectMemberCount(identifier: string) {
  return axiosInstance
    .get<ProjectMemberDto[]>(`/projects/${identifier}/members`)
    .then((r) => r.data.length);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const projectsQuery = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: fetchProjects,
  });

  const projects = projectsQuery.data?.items ?? [];

  // Fetch stats for each project
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', projects.map((p) => p.identifier)],
    queryFn: async (): Promise<ProjectStats[]> => {
      const results = await Promise.all(
        projects.map(async (project) => {
          const identifier = project.identifier!;
          const [issueCount, memberCount] = await Promise.all([
            fetchProjectIssueCount(identifier).catch(() => 0),
            fetchProjectMemberCount(identifier).catch(() => 0),
          ]);
          return { project, issueCount, memberCount };
        }),
      );
      return results;
    },
    enabled: projects.length > 0,
  });

  const projectStats = statsQuery.data ?? [];

  const isLoading = projectsQuery.isLoading;
  const isError = projectsQuery.isError;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>대시보드</Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          데이터를 불러오는데 실패했습니다.
        </Alert>
      )}

      {/* Summary row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FolderIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {isLoading ? <Skeleton width={40} /> : projects.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">전체 프로젝트</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BugReportIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {statsQuery.isLoading || isLoading ? (
                    <Skeleton width={40} />
                  ) : (
                    projectStats.reduce((sum, s) => sum + s.issueCount, 0)
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">전체 이슈</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Cards */}
      <Typography variant="h6" sx={{ mb: 2 }}>프로젝트 목록</Typography>

      {isLoading && (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            프로젝트가 없습니다. 프로젝트를 생성해주세요.
          </Typography>
        </Box>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <Grid container spacing={2}>
          {projects.map((project) => {
            const stats = projectStats.find((s) => s.project.id === project.id);
            return (
              <Grid key={project.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <Card
                  variant="outlined"
                  sx={{ height: '100%', '&:hover': { borderColor: 'primary.main' } }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/projects/${project.identifier}`)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {project.name}
                        </Typography>
                        {project.isPublic ? (
                          <Chip icon={<PublicIcon />} label="공개" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip icon={<LockIcon />} label="비공개" size="small" variant="outlined" />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {project.identifier}
                      </Typography>

                      {project.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {project.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BugReportIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {statsQuery.isLoading ? '...' : `이슈 ${stats?.issueCount ?? 0}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {statsQuery.isLoading ? '...' : `멤버 ${stats?.memberCount ?? 0}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(project.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Recent Activity placeholder */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>최근 활동</Typography>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              활동 피드는 다음 업데이트에서 제공될 예정입니다.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
