import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Paper, Grid,
  FormControl, InputLabel, Select, MenuItem,
  Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip, Link,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDtoPagedResult } from '../../../api/generated/model';
import type { AdminUserDtoPagedResult } from '../../../api/generated/model';
import { useAuthStore } from '../../../stores/authStore';

interface TimeEntry {
  id: number;
  projectName: string;
  issueSubject?: string;
  issueId?: number;
  userName: string;
  activityType: string;
  hours: number;
  spentOn: string;
  comments?: string;
}

interface TimeReportGroup {
  groupKey: string;
  groupId: number;
  totalHours: number;
  entries: TimeEntry[];
}

interface TimeReportDto {
  groups: TimeReportGroup[];
  totalHours: number;
}

type GroupBy = 'user' | 'project' | 'activity';

export default function TimeReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin ?? false;

  // Filter state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('user');
  const [isExporting, setIsExporting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Query params for the report (only set when "조회" is clicked)
  const [queryParams, setQueryParams] = useState<{
    from: string;
    to: string;
    projectId?: number;
    userId?: number;
    groupBy: GroupBy;
  } | null>(null);

  // Fetch projects for filter
  const projectsQuery = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () =>
      axiosInstance
        .get<ProjectDtoPagedResult>('/projects', { params: { PageSize: 100 } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch users for filter (admin only)
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: () =>
      axiosInstance
        .get<AdminUserDtoPagedResult>('/admin/users', { params: { PageSize: 100 } })
        .then((r) => r.data),
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch time report data
  const reportQuery = useQuery<TimeReportDto>({
    queryKey: ['reports', 'time', queryParams],
    queryFn: () =>
      axiosInstance
        .get<TimeReportDto>('/reports/time', {
          params: {
            from: queryParams!.from,
            to: queryParams!.to,
            projectId: queryParams!.projectId || undefined,
            userId: queryParams!.userId || undefined,
            groupBy: queryParams!.groupBy,
          },
        })
        .then((r) => r.data),
    enabled: !!queryParams,
  });

  const handleSearch = useCallback(() => {
    if (!from || !to) return;
    setHasSearched(true);
    setQueryParams({
      from,
      to,
      projectId: projectId ? Number(projectId) : undefined,
      userId: userId ? Number(userId) : undefined,
      groupBy,
    });
  }, [from, to, projectId, userId, groupBy]);

  const handleExportCsv = useCallback(async () => {
    if (!from || !to) return;
    setIsExporting(true);
    try {
      const response = await axiosInstance.get('/reports/time/export', {
        params: {
          from,
          to,
          projectId: projectId ? Number(projectId) : undefined,
          userId: userId ? Number(userId) : undefined,
          groupBy,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `time_report_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // error handled by axios interceptor
    } finally {
      setIsExporting(false);
    }
  }, [from, to, projectId, userId, groupBy]);

  const formatSpentOn = (dateStr: string) => {
    // spentOn is a DateOnly "2026-01-15" - no timezone conversion needed
    return dateStr;
  };

  const groups = reportQuery.data?.groups ?? [];
  const totalHours = reportQuery.data?.totalHours ?? 0;

  const groupByLabel: Record<GroupBy, string> = {
    user: '사용자별',
    project: '프로젝트별',
    activity: '활동유형별',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>
          시간 보고서
        </Typography>
        <Typography variant="body2" color="text.secondary">
          프로젝트별, 사용자별 소요 시간을 조회하고 내보낼 수 있습니다.
        </Typography>
      </Box>

      {/* Filter panel */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="시작일"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="종료일"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>프로젝트</InputLabel>
              <Select
                value={projectId}
                label="프로젝트"
                onChange={(e: SelectChangeEvent) => setProjectId(e.target.value)}
              >
                <MenuItem value="">전체 프로젝트</MenuItem>
                {(projectsQuery.data?.items ?? []).map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {isAdmin && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>사용자</InputLabel>
                <Select
                  value={userId}
                  label="사용자"
                  onChange={(e: SelectChangeEvent) => setUserId(e.target.value)}
                >
                  <MenuItem value="">전체 사용자</MenuItem>
                  {(usersQuery.data?.items ?? []).map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>그룹 기준</InputLabel>
              <Select
                value={groupBy}
                label="그룹 기준"
                onChange={(e: SelectChangeEvent) =>
                  setGroupBy(e.target.value as GroupBy)
                }
              >
                <MenuItem value="user">사용자별</MenuItem>
                <MenuItem value="project">프로젝트별</MenuItem>
                <MenuItem value="activity">활동유형별</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={!from || !to || reportQuery.isFetching}
              >
                조회
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  isExporting ? (
                    <CircularProgress size={18} />
                  ) : (
                    <DownloadIcon />
                  )
                }
                onClick={handleExportCsv}
                disabled={!from || !to || isExporting}
              >
                CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {!hasSearched && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            조건을 선택하고 조회 버튼을 클릭하세요
          </Typography>
        </Box>
      )}

      {hasSearched && reportQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {hasSearched && reportQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          시간 보고서를 불러오는데 실패했습니다.
        </Alert>
      )}

      {hasSearched &&
        !reportQuery.isLoading &&
        !reportQuery.isError &&
        reportQuery.data && (
          <>
            {groups.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 8,
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  해당 조건의 시간 기록이 없습니다
                </Typography>
              </Box>
            ) : (
              <>
                {/* Total hours */}
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AccessTimeIcon color="primary" />
                  <Typography variant="h6">
                    총 {totalHours.toFixed(1)}시간
                  </Typography>
                  <Chip
                    label={groupByLabel[queryParams?.groupBy ?? 'user']}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Paper>

                {/* Group accordions */}
                {groups.map((group) => (
                  <Accordion key={group.groupId} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          pr: 1,
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {group.groupKey}
                        </Typography>
                        <Chip
                          label={`${group.totalHours.toFixed(1)}시간`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>날짜</TableCell>
                              <TableCell>프로젝트</TableCell>
                              <TableCell>이슈</TableCell>
                              <TableCell>사용자</TableCell>
                              <TableCell>활동유형</TableCell>
                              <TableCell align="right">시간</TableCell>
                              <TableCell>비고</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.entries.map((entry) => (
                              <TableRow key={entry.id} hover>
                                <TableCell>
                                  <Typography variant="body2">
                                    {formatSpentOn(entry.spentOn)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {entry.projectName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {entry.issueId ? (
                                    <Link
                                      component="button"
                                      variant="body2"
                                      underline="hover"
                                      onClick={() => {
                                        // Navigate to the issue - find project from context
                                        // We use the projectName as a fallback identifier
                                        navigate(`/projects/${encodeURIComponent(entry.projectName)}/issues/${entry.issueId}`);
                                      }}
                                    >
                                      #{entry.issueId}{' '}
                                      {entry.issueSubject ?? ''}
                                    </Link>
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {entry.userName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={entry.activityType}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {entry.hours.toFixed(1)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {entry.comments ?? '-'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </>
            )}
          </>
        )}
    </Box>
  );
}
