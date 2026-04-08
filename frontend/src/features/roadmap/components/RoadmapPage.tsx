import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Chip, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Breadcrumbs, Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlagIcon from '@mui/icons-material/Flag';
import { QueryState, CardSkeleton } from '../../../components/common/QueryState';
import axiosInstance from '../../../api/axiosInstance';
import type { RoadmapVersionDto } from '../../../api/generated/model';
import { formatDate, getPriorityColor } from '../../issues/utils/issueUtils';

const VERSION_STATUS_MAP: Record<number, { label: string; color: 'success' | 'warning' | 'default' }> = {
  0: { label: '열림', color: 'success' },
  1: { label: '잠김', color: 'warning' },
  2: { label: '닫힘', color: 'default' },
};

function fetchRoadmap(identifier: string) {
  return axiosInstance
    .get<RoadmapVersionDto[]>(`/projects/${identifier}/roadmap`)
    .then((res) => res.data);
}

export default function RoadmapPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  const { data: versions, isLoading, isError, refetch } = useQuery({
    queryKey: ['roadmap', identifier],
    queryFn: () => fetchRoadmap(identifier!),
    enabled: !!identifier,
  });

  const items = versions ?? [];

  function handleToggleVersion(versionId: number) {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  }

  function handleIssueClick(issueId?: number) {
    if (issueId && identifier) {
      navigate(`/projects/${identifier}/issues/${issueId}`);
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
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
            {identifier}
          </Link>
          <Typography color="text.primary">로드맵</Typography>
        </Breadcrumbs>
        <Typography variant="h5">로드맵</Typography>
      </Box>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        onRetry={() => refetch()}
        errorMessage="로드맵 데이터를 불러오는데 실패했습니다."
        skeleton={<CardSkeleton count={3} />}
        emptyState={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <FlagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              등록된 버전이 없습니다
            </Typography>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((version) => {
            const statusInfo = VERSION_STATUS_MAP[version.status ?? 0] ?? VERSION_STATUS_MAP[0];
            const percentage = version.completionPercentage ?? 0;
            const totalIssues = version.totalIssues ?? 0;
            const closedIssues = version.closedIssues ?? 0;
            const openIssues = version.openIssues ?? 0;
            const issues = version.issues ?? [];
            const isExpanded = expandedVersions.has(version.id ?? 0);

            return (
              <Card key={version.id} variant="outlined">
                <CardContent>
                  {/* Header: version name + status chip + due date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {version.name}
                    </Typography>
                    <Chip
                      label={statusInfo.label}
                      color={statusInfo.color}
                      size="small"
                    />
                    {version.dueDate && (
                      <Typography variant="body2" color="text.secondary">
                        기한: {formatDate(version.dueDate)}
                      </Typography>
                    )}
                  </Box>

                  {/* Progress bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {percentage}% ({closedIssues}/{totalIssues})
                    </Typography>
                  </Box>

                  {/* Statistics */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      전체 {totalIssues}건
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      완료 {closedIssues}건
                    </Typography>
                    <Typography variant="body2" color="info.main">
                      진행중 {openIssues}건
                    </Typography>
                  </Box>

                  {/* Description */}
                  {version.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {version.description}
                    </Typography>
                  )}

                  {/* Issue list accordion */}
                  {issues.length > 0 && (
                    <Accordion
                      expanded={isExpanded}
                      onChange={() => handleToggleVersion(version.id ?? 0)}
                      disableGutters
                      elevation={0}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          이슈 목록 ({issues.length}건)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ minWidth: 50 }}>#</TableCell>
                                <TableCell sx={{ minWidth: 200 }}>제목</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>트래커</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>상태</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>우선순위</TableCell>
                                <TableCell sx={{ minWidth: 100 }}>담당자</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {issues.map((issue) => (
                                <TableRow
                                  key={issue.id}
                                  hover
                                  sx={{
                                    cursor: 'pointer',
                                    opacity: issue.isClosed ? 0.6 : 1,
                                  }}
                                  onClick={() => handleIssueClick(issue.id)}
                                >
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ textDecoration: issue.isClosed ? 'line-through' : 'none' }}
                                    >
                                      #{issue.id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 500,
                                        textDecoration: issue.isClosed ? 'line-through' : 'none',
                                        color: issue.isClosed ? 'text.secondary' : 'text.primary',
                                      }}
                                    >
                                      {issue.subject}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label={issue.trackerName ?? '-'} size="small" variant="outlined" />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={issue.statusName ?? '-'}
                                      size="small"
                                      color={issue.isClosed ? 'default' : 'success'}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={issue.priorityName ?? '-'}
                                      size="small"
                                      color={getPriorityColor(issue.priorityName)}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {issue.assigneeName ?? '-'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </QueryState>
    </Box>
  );
}
