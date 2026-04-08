import { useMemo, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Breadcrumbs, Link, Button, ButtonGroup,
  Skeleton, Alert, CircularProgress,
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import dayjs from 'dayjs';
import axiosInstance from '../../../api/axiosInstance';
import GanttChart from './GanttChart';
import type { ViewMode } from './GanttChart';
import type { GanttIssue } from './GanttBar';

interface ProjectDto {
  id?: number;
  name?: string | null;
  identifier?: string | null;
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

function fetchGanttData(identifier: string) {
  return axiosInstance
    .get<GanttIssue[]>(`/projects/${identifier}/gantt`)
    .then((res) => res.data);
}

export default function GanttChartPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isExporting, setExporting] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const ganttQuery = useQuery({
    queryKey: ['gantt', identifier],
    queryFn: () => fetchGanttData(identifier!),
    enabled: !!identifier,
  });

  // Filter: only issues with both startDate AND dueDate
  const filteredIssues = useMemo(() => {
    const data = ganttQuery.data ?? [];
    return data.filter((issue) => issue.startDate && issue.dueDate);
  }, [ganttQuery.data]);

  const handleBarClick = useCallback(
    (issueId: number) => {
      navigate(`/projects/${identifier}/issues/${issueId}`);
    },
    [identifier, navigate],
  );

  const handleBarDrag = useCallback(
    (issueId: number, deltaStartDays: number, deltaDueDays: number) => {
      const issue = filteredIssues.find((i) => i.id === issueId);
      if (!issue) return;

      const newStartDate = dayjs(issue.startDate).add(deltaStartDays, 'day').format('YYYY-MM-DD');
      const newDueDate = dayjs(issue.dueDate).add(deltaDueDays, 'day').format('YYYY-MM-DD');

      axiosInstance
        .put(`/Issues/${issueId}`, {
          startDate: newStartDate,
          dueDate: newDueDate,
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['gantt', identifier] });
        })
        .catch((err) => {
          console.error('간트 바 드래그 업데이트 실패:', err);
          queryClient.invalidateQueries({ queryKey: ['gantt', identifier] });
        });
    },
    [filteredIssues, identifier, queryClient],
  );

  const handleScrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gantt', identifier] });
  }, [identifier, queryClient]);

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const response = await axiosInstance.get(
        `/projects/${identifier}/gantt/export/pdf`,
        { params: { viewMode }, responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `gantt_${identifier}_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error is silently handled; the user sees the button stop loading
    } finally {
      setExporting(false);
    }
  }, [identifier, viewMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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
          <Typography color="text.primary">간트 차트</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="h5">간트 차트</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View mode toggle */}
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('day')}
              >
                일
              </Button>
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
              >
                주
              </Button>
              <Button
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('month')}
              >
                월
              </Button>
            </ButtonGroup>

            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleScrollToToday}
              size="small"
            >
              오늘
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size="small"
            >
              새로고침
            </Button>

            <Button
              variant="outlined"
              startIcon={isExporting ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              onClick={handleExportPdf}
              size="small"
              disabled={isExporting || filteredIssues.length === 0}
            >
              PDF
            </Button>
          </Box>
        </Box>

        {/* Summary info */}
        {!ganttQuery.isLoading && !ganttQuery.isError && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            총 {filteredIssues.length}개 이슈
            {ganttQuery.data && ganttQuery.data.length !== filteredIssues.length && (
              <> (날짜 미설정 {ganttQuery.data.length - filteredIssues.length}개 제외)</>
            )}
          </Typography>
        )}
      </Box>

      {/* Error */}
      {ganttQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          간트 데이터를 불러오는데 실패했습니다.
        </Alert>
      )}

      {/* Loading */}
      {ganttQuery.isLoading && (
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 1 }} />
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 1, mb: 0.5 }} />
          ))}
        </Box>
      )}

      {/* Gantt Chart */}
      {!ganttQuery.isLoading && !ganttQuery.isError && (
        <>
          {filteredIssues.length === 0 ? (
            <Alert severity="info">
              표시할 이슈가 없습니다. 시작일과 종료일이 설정된 이슈가 필요합니다.
            </Alert>
          ) : (
            <GanttChart
              issues={filteredIssues}
              viewMode={viewMode}
              onBarClick={handleBarClick}
              onBarDrag={handleBarDrag}
              todayRef={todayRef}
            />
          )}
        </>
      )}
    </Box>
  );
}
