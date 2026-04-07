import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Skeleton, Alert, Breadcrumbs, Link, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import axiosInstance from '../../../api/axiosInstance';
import type { IssueStatusDto, ProjectDto } from '../../../api/generated/model';
import KanbanColumn from './KanbanColumn';
import type { KanbanIssue } from './KanbanCard';

// Extended issue DTO that includes position and IDs needed for kanban
interface KanbanIssueRaw {
  id?: number;
  subject?: string | null;
  trackerName?: string | null;
  statusId?: number;
  statusName?: string | null;
  priorityName?: string | null;
  assignedToName?: string | null;
  doneRatio?: number;
  position?: number;
}

interface KanbanIssuesResponse {
  items?: KanbanIssueRaw[] | null;
  totalCount?: number;
}

function fetchStatuses() {
  return axiosInstance
    .get<IssueStatusDto[]>('/issue-statuses')
    .then((res) => res.data);
}

function fetchKanbanIssues(identifier: string) {
  // Fetch with large page size to get all issues; the backend may add
  // statusId / position fields to IssueDto in the kanban context.
  return axiosInstance
    .get<KanbanIssuesResponse>(`/projects/${identifier}/issues`, {
      params: { Page: 1, PageSize: 500 },
    })
    .then((res) => res.data);
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function KanbanBoardPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local optimistic state override
  const [localIssueMap, setLocalIssueMap] = useState<Record<number, KanbanIssue[]> | null>(null);

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const statusesQuery = useQuery({
    queryKey: ['issue-statuses'],
    queryFn: fetchStatuses,
    staleTime: Infinity,
  });

  const issuesQuery = useQuery({
    queryKey: ['kanban-issues', identifier],
    queryFn: () => fetchKanbanIssues(identifier!),
    enabled: !!identifier,
  });

  // Sort statuses: open first (by position), then closed (by position)
  const sortedStatuses = useMemo(() => {
    const all = statusesQuery.data ?? [];
    const open = all.filter((s) => !s.isClosed).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const closed = all.filter((s) => s.isClosed).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return [...open, ...closed];
  }, [statusesQuery.data]);

  // Map issues to KanbanIssue[], grouped by statusId
  const issuesByStatus: Record<number, KanbanIssue[]> = useMemo(() => {
    if (localIssueMap) return localIssueMap;

    const items = issuesQuery.data?.items ?? [];
    const map: Record<number, KanbanIssue[]> = {};

    // Initialize all status columns
    for (const s of sortedStatuses) {
      if (s.id != null) map[s.id] = [];
    }

    for (const raw of items) {
      if (raw.id == null) continue;
      // Try to find statusId from the raw data; fallback: match by statusName
      let statusId = (raw as KanbanIssueRaw).statusId;
      if (statusId == null) {
        const matched = sortedStatuses.find((s) => s.name === raw.statusName);
        statusId = matched?.id;
      }
      if (statusId == null) continue;

      if (!map[statusId]) map[statusId] = [];
      map[statusId].push({
        id: raw.id,
        subject: raw.subject ?? '',
        trackerName: raw.trackerName,
        statusId,
        statusName: raw.statusName,
        priorityName: raw.priorityName,
        assignedToName: raw.assignedToName,
        doneRatio: raw.doneRatio ?? 0,
        position: raw.position ?? 10000,
      });
    }

    // Sort each group by position
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.position - b.position);
    }

    return map;
  }, [issuesQuery.data, sortedStatuses, localIssueMap]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const sourceStatusId = Number(result.source.droppableId.replace('status-', ''));
      const destStatusId = Number(result.destination.droppableId.replace('status-', ''));
      const issueId = Number(result.draggableId.replace('issue-', ''));
      const destIndex = result.destination.index;

      // Clone current state
      const cloned: Record<number, KanbanIssue[]> = {};
      for (const key of Object.keys(issuesByStatus)) {
        cloned[Number(key)] = [...issuesByStatus[Number(key)]];
      }

      // Remove from source
      const sourceList = cloned[sourceStatusId] ?? [];
      const movedIndex = sourceList.findIndex((i) => i.id === issueId);
      if (movedIndex === -1) return;
      const [moved] = sourceList.splice(movedIndex, 1);

      // Calculate new position
      const destList = cloned[destStatusId] ?? [];
      let newPosition: number;
      if (destList.length === 0) {
        newPosition = 10000;
      } else if (destIndex === 0) {
        newPosition = (destList[0].position ?? 10000) / 2;
      } else if (destIndex >= destList.length) {
        newPosition = (destList[destList.length - 1].position ?? 10000) + 10000;
      } else {
        const before = destList[destIndex - 1].position ?? 0;
        const after = destList[destIndex].position ?? before + 20000;
        newPosition = Math.floor((before + after) / 2);
      }

      // Insert at dest
      moved.position = newPosition;
      moved.statusId = destStatusId;
      if (!cloned[destStatusId]) cloned[destStatusId] = [];
      cloned[destStatusId].splice(destIndex, 0, moved);

      // Optimistic update
      setLocalIssueMap(cloned);

      // API call
      axiosInstance
        .put(`/Issues/${issueId}/position`, {
          statusId: destStatusId !== sourceStatusId ? destStatusId : undefined,
          position: newPosition,
        })
        .then(() => {
          // Clear local override so we use server data next time
          setLocalIssueMap(null);
          queryClient.invalidateQueries({ queryKey: ['kanban-issues', identifier] });
        })
        .catch(() => {
          // Rollback
          setLocalIssueMap(null);
          queryClient.invalidateQueries({ queryKey: ['kanban-issues', identifier] });
        });
    },
    [issuesByStatus, identifier, queryClient],
  );

  function handleRefresh() {
    setLocalIssueMap(null);
    queryClient.invalidateQueries({ queryKey: ['kanban-issues', identifier] });
  }

  const isLoading = statusesQuery.isLoading || issuesQuery.isLoading;
  const isError = statusesQuery.isError || issuesQuery.isError;

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
          <Typography color="text.primary">칸반 보드</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">칸반 보드</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/projects/${identifier}/issues`)}
              size="small"
            >
              이슈 목록
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          칸반 데이터를 불러오는데 실패했습니다.
        </Alert>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', flex: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ minWidth: 280, flexShrink: 0 }}>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      )}

      {/* Kanban board */}
      {!isLoading && !isError && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              minHeight: 'calc(100vh - 200px)',
              pb: 2,
              flex: 1,
            }}
          >
            {sortedStatuses.map((status) => (
              <Droppable droppableId={`status-${status.id}`} key={status.id}>
                {(provided) => (
                  <KanbanColumn
                    statusId={status.id ?? 0}
                    statusName={status.name ?? ''}
                    isClosed={status.isClosed ?? false}
                    issues={issuesByStatus[status.id ?? 0] ?? []}
                    provided={provided}
                    onClickIssue={(issueId) => navigate(`/projects/${identifier}/issues/${issueId}`)}
                  />
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      )}
    </Box>
  );
}
