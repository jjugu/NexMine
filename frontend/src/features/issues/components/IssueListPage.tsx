import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Skeleton, TablePagination, Card, CardContent,
  CardActionArea, useMediaQuery, useTheme, Grid,
  MenuItem, Select, FormControl, InputLabel, IconButton,
  Breadcrumbs, Link, Collapse, LinearProgress, TableSortLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BugReportIcon from '@mui/icons-material/BugReport';
import axiosInstance from '../../../api/axiosInstance';
import type { IssueDtoPagedResult, ProjectDto } from '../../../api/generated/model';
import {
  useTrackers,
  useIssueStatuses,
  useIssuePriorities,
  useProjectMembers,
} from '../hooks/useReferenceData';
import { formatDate, getPriorityColor } from '../utils/issueUtils';

type SortField = 'id' | 'subject' | 'trackerName' | 'statusName' | 'priorityName' | 'assignedToName' | 'doneRatio' | 'updatedAt';

function fetchIssues(
  identifier: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  return axiosInstance
    .get<IssueDtoPagedResult>(`/projects/${identifier}/issues`, { params })
    .then((res) => res.data);
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function IssueListPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(!isMobile);

  // URL params
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);
  const searchFromUrl = searchParams.get('search') ?? '';
  const trackerIdFilter = searchParams.get('trackerId') ?? '';
  const statusIdFilter = searchParams.get('statusId') ?? '';
  const priorityIdFilter = searchParams.get('priorityId') ?? '';
  const assignedToIdFilter = searchParams.get('assignedToId') ?? '';
  const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as SortField | 'createdAt';
  const sortDesc = searchParams.get('sortDesc') !== 'false';

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  // Reference data
  const trackersQuery = useTrackers();
  const statusesQuery = useIssueStatuses();
  const prioritiesQuery = useIssuePriorities();
  const membersQuery = useProjectMembers(identifier);

  // Project info for breadcrumb
  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchInput) {
        newParams.set('search', searchInput);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1');
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build query params
  const queryParams: Record<string, string | number | boolean | undefined> = {
    Page: page,
    PageSize: pageSize,
    Search: searchFromUrl || undefined,
    TrackerId: trackerIdFilter ? Number(trackerIdFilter) : undefined,
    StatusId: statusIdFilter ? Number(statusIdFilter) : undefined,
    PriorityId: priorityIdFilter ? Number(priorityIdFilter) : undefined,
    AssignedToId: assignedToIdFilter ? Number(assignedToIdFilter) : undefined,
    SortBy: sortBy,
    SortDesc: sortDesc,
  };

  const issuesQuery = useQuery({
    queryKey: ['issues', identifier, queryParams],
    queryFn: () => fetchIssues(identifier!, queryParams),
    enabled: !!identifier,
  });

  const items = issuesQuery.data?.items ?? [];
  const totalCount = issuesQuery.data?.totalCount ?? 0;

  function handleFilterChange(key: string, value: string) {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams, { replace: true });
  }

  function handleSort(field: SortField) {
    const newParams = new URLSearchParams(searchParams);
    if (sortBy === field) {
      newParams.set('sortDesc', String(!sortDesc));
    } else {
      newParams.set('sortBy', field);
      newParams.set('sortDesc', 'true');
    }
    newParams.set('page', '1');
    setSearchParams(newParams, { replace: true });
  }

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(newPage + 1));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('pageSize', event.target.value);
      newParams.set('page', '1');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  function handleRowClick(issueId?: number) {
    if (issueId && identifier) {
      navigate(`/projects/${identifier}/issues/${issueId}`);
    }
  }

  function handleNewIssue() {
    navigate(`/projects/${identifier}/issues/new`);
  }

  const sortDirection = sortDesc ? 'desc' : 'asc';

  const columns: Array<{ field: SortField; label: string; minWidth?: number }> = [
    { field: 'id', label: '#', minWidth: 60 },
    { field: 'subject', label: '제목', minWidth: 200 },
    { field: 'trackerName', label: '트래커', minWidth: 80 },
    { field: 'statusName', label: '상태', minWidth: 80 },
    { field: 'priorityName', label: '우선순위', minWidth: 80 },
    { field: 'assignedToName', label: '담당자', minWidth: 100 },
    { field: 'doneRatio', label: '진행률', minWidth: 80 },
    { field: 'updatedAt', label: '갱신일', minWidth: 100 },
  ];

  return (
    <Box>
      {/* Breadcrumb + header */}
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
            {projectQuery.data?.name ?? identifier}
          </Link>
          <Typography color="text.primary">이슈</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">이슈</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              color={isFilterOpen ? 'primary' : 'default'}
            >
              <FilterListIcon />
            </IconButton>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewIssue}>
              새 이슈
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Filter panel */}
      <Collapse in={isFilterOpen}>
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                placeholder="이슈 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>트래커</InputLabel>
                <Select
                  value={trackerIdFilter}
                  label="트래커"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('trackerId', e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {(trackersQuery.data ?? []).map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select
                  value={statusIdFilter}
                  label="상태"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('statusId', e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {(statusesQuery.data ?? []).map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={priorityIdFilter}
                  label="우선순위"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('priorityId', e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {(prioritiesQuery.data ?? []).map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>담당자</InputLabel>
                <Select
                  value={assignedToIdFilter}
                  label="담당자"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('assignedToId', e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {(membersQuery.data ?? []).map((m) => (
                    <MenuItem key={m.userId} value={String(m.userId)}>{m.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Loading */}
      {issuesQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {/* Error */}
      {issuesQuery.isError && (
        <Typography color="error" sx={{ mt: 2 }}>
          이슈 목록을 불러오는데 실패했습니다.
        </Typography>
      )}

      {/* Empty state */}
      {!issuesQuery.isLoading && !issuesQuery.isError && items.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <BugReportIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            이슈가 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            첫 이슈를 등록해보세요
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewIssue}>
            새 이슈 만들기
          </Button>
        </Box>
      )}

      {/* Desktop: table view */}
      {!issuesQuery.isLoading && !issuesQuery.isError && items.length > 0 && !isMobile && (
        <TableContainer component={Paper} variant="outlined">
          {issuesQuery.isFetching && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.field} sx={{ minWidth: col.minWidth }}>
                    <TableSortLabel
                      active={sortBy === col.field}
                      direction={sortBy === col.field ? sortDirection : 'asc'}
                      onClick={() => handleSort(col.field)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((issue) => (
                <TableRow
                  key={issue.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(issue.id)}
                >
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      #{issue.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {issue.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={issue.trackerName ?? '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={issue.statusName ?? '-'} size="small" color="success" variant="outlined" />
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
                      {issue.assignedToName ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                      <LinearProgress
                        variant="determinate"
                        value={issue.doneRatio ?? 0}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {issue.doneRatio ?? 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(issue.updatedAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당 항목"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* Mobile: card view */}
      {!issuesQuery.isLoading && !issuesQuery.isError && items.length > 0 && isMobile && (
        <>
          {issuesQuery.isFetching && <LinearProgress sx={{ mb: 1 }} />}
          <Grid container spacing={1.5}>
            {items.map((issue) => (
              <Grid key={issue.id} size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => handleRowClick(issue.id)}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            #{issue.id}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {issue.subject}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <Chip
                            label={issue.statusName ?? '-'}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                          <Chip
                            label={issue.priorityName ?? '-'}
                            size="small"
                            color={getPriorityColor(issue.priorityName)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {issue.trackerName} &middot; {issue.assignedToName ?? '미배정'} &middot; {formatDate(issue.updatedAt)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      )}
    </Box>
  );
}
