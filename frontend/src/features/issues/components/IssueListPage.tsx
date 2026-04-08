import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, TablePagination, Card, CardContent,
  CardActionArea, useMediaQuery, useTheme, Grid,
  MenuItem, Select, FormControl, InputLabel, IconButton,
  Breadcrumbs, Link, Collapse, LinearProgress, TableSortLabel,
  CircularProgress, Tooltip, Checkbox, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch,
  Menu, ListItemIcon, ListItemText, Divider, Popover,
  List, ListItem, ListItemButton,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import RestoreIcon from '@mui/icons-material/Restore';
import { QueryState, TableSkeleton, CardSkeleton } from '../../../components/common/QueryState';
import axiosInstance from '../../../api/axiosInstance';
import type { IssueDtoPagedResult, IssueDto, ProjectDto, BulkUpdateIssuesRequest, SavedQueryDto } from '../../../api/generated/model';
import { useAuthStore } from '../../../stores/authStore';
import {
  useTrackers,
  useIssueStatuses,
  useIssuePriorities,
  useProjectMembers,
} from '../hooks/useReferenceData';
import { formatDate, getPriorityColor } from '../utils/issueUtils';
import ImportIssuesDialog from './ImportIssuesDialog';
import CopyIssueDialog from './CopyIssueDialog';

// --- Column customization types ---

interface ColumnDef {
  key: string;
  label: string;
  sortField?: string;
  minWidth?: number;
  alwaysVisible?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'id', label: '#', sortField: 'id', minWidth: 60, alwaysVisible: true },
  { key: 'subject', label: '제목', sortField: 'subject', minWidth: 200, alwaysVisible: true },
  { key: 'tracker', label: '트래커', sortField: 'trackerName', minWidth: 80 },
  { key: 'status', label: '상태', sortField: 'statusName', minWidth: 80 },
  { key: 'priority', label: '우선순위', sortField: 'priorityName', minWidth: 80 },
  { key: 'assignee', label: '담당자', sortField: 'assignedToName', minWidth: 100 },
  { key: 'author', label: '작성자', minWidth: 100 },
  { key: 'startDate', label: '시작일', minWidth: 100 },
  { key: 'dueDate', label: '기한', minWidth: 100 },
  { key: 'doneRatio', label: '진행률', sortField: 'doneRatio', minWidth: 80 },
  { key: 'estimatedHours', label: '예상시간', minWidth: 80 },
  { key: 'createdAt', label: '생성일', minWidth: 100 },
  { key: 'updatedAt', label: '갱신일', sortField: 'updatedAt', minWidth: 100 },
];

const DEFAULT_COLUMNS = ['id', 'subject', 'tracker', 'status', 'priority', 'assignee', 'dueDate', 'doneRatio'];
const STORAGE_KEY = 'nexmine-issue-columns';

function loadColumns(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure alwaysVisible columns are included
        const alwaysKeys = ALL_COLUMNS.filter((c) => c.alwaysVisible).map((c) => c.key);
        const merged = [...new Set([...alwaysKeys, ...parsed])];
        return merged;
      }
    }
  } catch {
    // ignore parse error
  }
  return DEFAULT_COLUMNS;
}

function renderCell(issue: IssueDto, columnKey: string): React.ReactNode {
  switch (columnKey) {
    case 'id':
      return (
        <Typography variant="body2" color="text.secondary">
          #{issue.id}
        </Typography>
      );
    case 'subject':
      return (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {issue.subject}
        </Typography>
      );
    case 'tracker':
      return <Chip label={issue.trackerName ?? '-'} size="small" variant="outlined" />;
    case 'status':
      return <Chip label={issue.statusName ?? '-'} size="small" color="success" variant="outlined" />;
    case 'priority':
      return (
        <Chip
          label={issue.priorityName ?? '-'}
          size="small"
          color={getPriorityColor(issue.priorityName)}
          variant="outlined"
        />
      );
    case 'assignee':
      return (
        <Typography variant="body2" color="text.secondary">
          {issue.assignedToName ?? '-'}
        </Typography>
      );
    case 'author':
      return (
        <Typography variant="body2" color="text.secondary">
          {issue.authorName ?? '-'}
        </Typography>
      );
    case 'startDate':
      return (
        <Typography variant="body2" color="text.secondary">
          {formatDate(issue.startDate)}
        </Typography>
      );
    case 'dueDate':
      return (
        <Typography variant="body2" color="text.secondary">
          {formatDate(issue.dueDate)}
        </Typography>
      );
    case 'doneRatio':
      return (
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
      );
    case 'estimatedHours':
      return (
        <Typography variant="body2" color="text.secondary">
          {issue.estimatedHours != null ? `${issue.estimatedHours}h` : '-'}
        </Typography>
      );
    case 'createdAt':
      return (
        <Typography variant="body2" color="text.secondary">
          {formatDate(issue.createdAt)}
        </Typography>
      );
    case 'updatedAt':
      return (
        <Typography variant="body2" color="text.secondary">
          {formatDate(issue.updatedAt)}
        </Typography>
      );
    default:
      return '-';
  }
}

// --- Sort field type ---
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
  const queryClient = useQueryClient();

  // Bulk edit state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusId, setBulkStatusId] = useState('');
  const [bulkPriorityId, setBulkPriorityId] = useState('');
  const [bulkAssignedToId, setBulkAssignedToId] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Column customization state
  const [selectedColumns, setSelectedColumns] = useState<string[]>(loadColumns);
  const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLElement | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    issue: IssueDto;
  } | null>(null);
  const [statusSubMenuAnchor, setStatusSubMenuAnchor] = useState<HTMLElement | null>(null);
  const [assigneeSubMenuAnchor, setAssigneeSubMenuAnchor] = useState<HTMLElement | null>(null);
  const [prioritySubMenuAnchor, setPrioritySubMenuAnchor] = useState<HTMLElement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetIssue, setDeleteTargetIssue] = useState<IssueDto | null>(null);

  // Copy issue dialog state
  const [copyIssueOpen, setCopyIssueOpen] = useState(false);
  const [copyTargetIssue, setCopyTargetIssue] = useState<IssueDto | null>(null);

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
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Saved filter state
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveFilterPublic, setSaveFilterPublic] = useState(false);
  const { user } = useAuthStore();

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkUpdateIssuesRequest) =>
      axiosInstance.put('/issues/bulk-update', data),
    onSuccess: (res) => {
      const count = res.data?.updatedCount ?? selectedIds.size;
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setSelectedIds(new Set());
      setBulkStatusId('');
      setBulkPriorityId('');
      setBulkAssignedToId('');
      setSnackbar({ open: true, message: `${count}개 이슈가 업데이트되었습니다.`, severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '일괄 업데이트에 실패했습니다.', severity: 'error' });
    },
  });

  // Context menu: update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      axiosInstance.put(`/Issues/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setSnackbar({ open: true, message: '이슈가 업데이트되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '이슈 업데이트에 실패했습니다.', severity: 'error' });
    },
  });

  // Context menu: delete issue mutation
  const deleteIssueMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/Issues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setDeleteConfirmOpen(false);
      setDeleteTargetIssue(null);
      setSnackbar({ open: true, message: '이슈가 삭제되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '이슈 삭제에 실패했습니다.', severity: 'error' });
    },
  });

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

  const projectId = projectQuery.data?.id;

  // Saved queries
  const savedQueriesQuery = useQuery({
    queryKey: ['saved-queries', projectId],
    queryFn: () =>
      axiosInstance
        .get<SavedQueryDto[]>('/saved-queries', { params: { projectId } })
        .then((res) => res.data),
    enabled: !!projectId,
  });

  const savedQueries = savedQueriesQuery.data ?? [];

  const saveFilterMutation = useMutation({
    mutationFn: (data: { projectId?: number | null; name: string; filters: Record<string, string>; isPublic: boolean }) =>
      axiosInstance.post('/saved-queries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
      setSaveFilterOpen(false);
      setSaveFilterName('');
      setSaveFilterPublic(false);
      setSnackbar({ open: true, message: '필터가 저장되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '필터 저장에 실패했습니다.', severity: 'error' });
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id: number) => axiosInstance.delete(`/saved-queries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-queries'] });
      setSnackbar({ open: true, message: '필터가 삭제되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '필터 삭제에 실패했습니다.', severity: 'error' });
    },
  });

  function handleSaveFilter() {
    if (!saveFilterName.trim()) return;
    const filters: Record<string, string> = {};
    if (searchFromUrl) filters.search = searchFromUrl;
    if (trackerIdFilter) filters.trackerId = trackerIdFilter;
    if (statusIdFilter) filters.statusId = statusIdFilter;
    if (priorityIdFilter) filters.priorityId = priorityIdFilter;
    if (assignedToIdFilter) filters.assignedToId = assignedToIdFilter;
    saveFilterMutation.mutate({
      projectId: projectId ?? null,
      name: saveFilterName.trim(),
      filters,
      isPublic: saveFilterPublic,
    });
  }

  function handleApplyFilter(filters: Record<string, string> | null | undefined) {
    if (!filters) return;
    const params = new URLSearchParams(filters);
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  }

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

  const { data: issuesData, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['issues', identifier, queryParams],
    queryFn: () => fetchIssues(identifier!, queryParams),
    enabled: !!identifier,
  });

  const items = issuesData?.items ?? [];
  const totalCount = issuesData?.totalCount ?? 0;

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

  function handleSort(field: string) {
    const colDef = ALL_COLUMNS.find((c) => c.key === field);
    const sortField = colDef?.sortField;
    if (!sortField) return;

    const newParams = new URLSearchParams(searchParams);
    if (sortBy === sortField) {
      newParams.set('sortDesc', String(!sortDesc));
    } else {
      newParams.set('sortBy', sortField);
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

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(items.filter((i) => i.id != null).map((i) => i.id!)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(issueId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(issueId);
      } else {
        next.delete(issueId);
      }
      return next;
    });
  }

  function handleBulkApply() {
    if (selectedIds.size === 0) return;
    const request: BulkUpdateIssuesRequest = {
      issueIds: Array.from(selectedIds),
      statusId: bulkStatusId ? Number(bulkStatusId) : null,
      priorityId: bulkPriorityId ? Number(bulkPriorityId) : null,
      assignedToId: bulkAssignedToId ? Number(bulkAssignedToId) : null,
    };
    // Only submit if at least one field is set
    if (!request.statusId && !request.priorityId && !request.assignedToId) return;
    bulkUpdateMutation.mutate(request);
  }

  function handleBulkCancel() {
    setSelectedIds(new Set());
    setBulkStatusId('');
    setBulkPriorityId('');
    setBulkAssignedToId('');
  }

  const isAllSelected = items.length > 0 && items.every((i) => i.id != null && selectedIds.has(i.id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const handleExportCsv = useCallback(async () => {
    if (!identifier) return;
    setIsExporting(true);
    try {
      const exportParams: Record<string, string | number | undefined> = {
        search: searchFromUrl || undefined,
        trackerId: trackerIdFilter ? Number(trackerIdFilter) : undefined,
        statusId: statusIdFilter ? Number(statusIdFilter) : undefined,
        priorityId: priorityIdFilter ? Number(priorityIdFilter) : undefined,
        assignedToId: assignedToIdFilter ? Number(assignedToIdFilter) : undefined,
      };
      const response = await axiosInstance.get(
        `/projects/${identifier}/issues/export`,
        { params: exportParams, responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `issues_${new Date().toISOString().slice(0, 10)}.csv`,
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
  }, [identifier, searchFromUrl, trackerIdFilter, statusIdFilter, priorityIdFilter, assignedToIdFilter]);

  const handleExportPdf = useCallback(async () => {
    if (!identifier) return;
    setIsExportingPdf(true);
    try {
      const exportParams: Record<string, string | number | undefined> = {
        search: searchFromUrl || undefined,
        trackerId: trackerIdFilter ? Number(trackerIdFilter) : undefined,
        statusId: statusIdFilter ? Number(statusIdFilter) : undefined,
        priorityId: priorityIdFilter ? Number(priorityIdFilter) : undefined,
        assignedToId: assignedToIdFilter ? Number(assignedToIdFilter) : undefined,
      };
      const response = await axiosInstance.get(
        `/projects/${identifier}/issues/export/pdf`,
        { params: exportParams, responseType: 'blob' },
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `issues_${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // error handled by axios interceptor
    } finally {
      setIsExportingPdf(false);
    }
  }, [identifier, searchFromUrl, trackerIdFilter, statusIdFilter, priorityIdFilter, assignedToIdFilter]);

  // --- Column customization handlers ---
  function handleToggleColumn(key: string) {
    const colDef = ALL_COLUMNS.find((c) => c.key === key);
    if (colDef?.alwaysVisible) return;

    setSelectedColumns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleResetColumns() {
    setSelectedColumns(DEFAULT_COLUMNS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLUMNS));
  }

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key)),
    [selectedColumns],
  );

  const sortDirection = sortDesc ? 'desc' : 'asc';

  // --- Context menu handlers ---
  function handleContextMenu(event: React.MouseEvent, issue: IssueDto) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, issue });
  }

  function handleCloseContextMenu() {
    setContextMenu(null);
    setStatusSubMenuAnchor(null);
    setAssigneeSubMenuAnchor(null);
    setPrioritySubMenuAnchor(null);
  }

  function handleContextMenuAction(action: string) {
    if (!contextMenu) return;
    const issue = contextMenu.issue;

    switch (action) {
      case 'view':
        handleCloseContextMenu();
        handleRowClick(issue.id);
        break;
      case 'copy':
        handleCloseContextMenu();
        setCopyTargetIssue(issue);
        setCopyIssueOpen(true);
        break;
      case 'delete':
        handleCloseContextMenu();
        setDeleteTargetIssue(issue);
        setDeleteConfirmOpen(true);
        break;
      default:
        break;
    }
  }

  function handleStatusChange(statusId: number) {
    if (!contextMenu?.issue?.id) return;
    updateIssueMutation.mutate({ id: contextMenu.issue.id, payload: { statusId } });
    handleCloseContextMenu();
  }

  function handleAssigneeChange(assignedToId: number | null) {
    if (!contextMenu?.issue?.id) return;
    updateIssueMutation.mutate({ id: contextMenu.issue.id, payload: { assignedToId } });
    handleCloseContextMenu();
  }

  function handlePriorityChange(priorityId: number) {
    if (!contextMenu?.issue?.id) return;
    updateIssueMutation.mutate({ id: contextMenu.issue.id, payload: { priorityId } });
    handleCloseContextMenu();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetIssue?.id) return;
    deleteIssueMutation.mutate(deleteTargetIssue.id);
  }

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
            <Tooltip title="CSV 가져오기">
              <IconButton onClick={() => setIsImportOpen(true)}>
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="CSV 내보내기">
              <span>
                <IconButton
                  onClick={handleExportCsv}
                  disabled={isExporting}
                >
                  {isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="PDF 내보내기">
              <span>
                <IconButton
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="필터 저장">
              <IconButton
                onClick={() => setSaveFilterOpen(true)}
              >
                <BookmarkBorderIcon />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="컬럼 설정">
                <IconButton onClick={(e) => setColumnAnchorEl(e.currentTarget)}>
                  <ViewColumnIcon />
                </IconButton>
              </Tooltip>
            )}
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

      {/* Column settings popover */}
      <Popover
        open={Boolean(columnAnchorEl)}
        anchorEl={columnAnchorEl}
        onClose={() => setColumnAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>표시할 컬럼</Typography>
          <List dense disablePadding>
            {ALL_COLUMNS.map((col) => (
              <ListItem key={col.key} disablePadding>
                <ListItemButton
                  onClick={() => handleToggleColumn(col.key)}
                  disabled={col.alwaysVisible}
                  dense
                >
                  <Checkbox
                    edge="start"
                    checked={selectedColumns.includes(col.key)}
                    disabled={col.alwaysVisible}
                    size="small"
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText primary={col.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Button
            size="small"
            startIcon={<RestoreIcon />}
            onClick={handleResetColumns}
            sx={{ mt: 1 }}
            fullWidth
          >
            기본값 복원
          </Button>
        </Box>
      </Popover>

      {/* Saved filters */}
      {savedQueries.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, alignItems: 'center' }}>
          <BookmarkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
          {savedQueries.map((sq) => (
            <Chip
              key={sq.id}
              label={sq.isPublic ? `${sq.name} (${sq.userName ?? ''})` : sq.name}
              size="small"
              variant="outlined"
              color={sq.isPublic ? 'default' : 'primary'}
              onClick={() => handleApplyFilter(sq.filters)}
              onDelete={
                sq.userId === user?.id
                  ? () => { if (sq.id != null) deleteFilterMutation.mutate(sq.id); }
                  : undefined
              }
            />
          ))}
        </Box>
      )}

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

      {/* Bulk edit toolbar */}
      {selectedIds.size > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            top: 64,
            zIndex: 10,
            p: 1.5,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            {selectedIds.size}개 선택됨
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>상태</InputLabel>
            <Select
              value={bulkStatusId}
              label="상태"
              onChange={(e: SelectChangeEvent) => setBulkStatusId(e.target.value)}
            >
              <MenuItem value="">-</MenuItem>
              {(statusesQuery.data ?? []).map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>우선순위</InputLabel>
            <Select
              value={bulkPriorityId}
              label="우선순위"
              onChange={(e: SelectChangeEvent) => setBulkPriorityId(e.target.value)}
            >
              <MenuItem value="">-</MenuItem>
              {(prioritiesQuery.data ?? []).map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>담당자</InputLabel>
            <Select
              value={bulkAssignedToId}
              label="담당자"
              onChange={(e: SelectChangeEvent) => setBulkAssignedToId(e.target.value)}
            >
              <MenuItem value="">-</MenuItem>
              {(membersQuery.data ?? []).map((m) => (
                <MenuItem key={m.userId} value={String(m.userId)}>{m.username}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            size="small"
            onClick={handleBulkApply}
            disabled={bulkUpdateMutation.isPending || (!bulkStatusId && !bulkPriorityId && !bulkAssignedToId)}
          >
            {bulkUpdateMutation.isPending ? <CircularProgress size={16} sx={{ mr: 0.5 }} /> : null}
            적용
          </Button>
          <IconButton size="small" onClick={handleBulkCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        onRetry={() => refetch()}
        errorMessage="이슈 목록을 불러오는데 실패했습니다."
        skeleton={isMobile ? <CardSkeleton count={5} /> : <TableSkeleton rows={5} columns={visibleColumns.length + 1} />}
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
        }
      >
        {/* Desktop: table view */}
        {!isMobile && (
          <TableContainer component={Paper} variant="outlined">
            {isFetching && <LinearProgress />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key} sx={{ minWidth: col.minWidth }}>
                      {col.sortField ? (
                        <TableSortLabel
                          active={sortBy === col.sortField}
                          direction={sortBy === col.sortField ? sortDirection : 'asc'}
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((issue) => (
                  <TableRow
                    key={issue.id}
                    hover
                    selected={issue.id != null && selectedIds.has(issue.id)}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(issue.id)}
                    onContextMenu={(e) => handleContextMenu(e, issue)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={issue.id != null && selectedIds.has(issue.id)}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (issue.id != null) handleSelectOne(issue.id, e.target.checked);
                        }}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>
                        {renderCell(issue, col.key)}
                      </TableCell>
                    ))}
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
        {isMobile && (
          <>
            {isFetching && <LinearProgress sx={{ mb: 1 }} />}
            <Grid container spacing={1.5}>
              {items.map((issue) => (
                <Grid key={issue.id} size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ ...(issue.id != null && selectedIds.has(issue.id) ? { borderColor: 'primary.main', bgcolor: 'action.selected' } : {}) }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={issue.id != null && selectedIds.has(issue.id)}
                        size="small"
                        sx={{ mt: 0.5, ml: 0.5 }}
                        onChange={(e) => {
                          if (issue.id != null) handleSelectOne(issue.id, e.target.checked);
                        }}
                      />
                      <CardActionArea
                        onClick={() => handleRowClick(issue.id)}
                        onContextMenu={(e) => handleContextMenu(e, issue)}
                      >
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
                    </Box>
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
      </QueryState>

      {/* Context menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleContextMenuAction('view')}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>상세 보기</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => setStatusSubMenuAnchor(e.currentTarget)}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>상태 변경</ListItemText>
          <ArrowRightIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem
          onClick={(e) => setAssigneeSubMenuAnchor(e.currentTarget)}
        >
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>담당자 변경</ListItemText>
          <ArrowRightIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem
          onClick={(e) => setPrioritySubMenuAnchor(e.currentTarget)}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>우선순위 변경</ListItemText>
          <ArrowRightIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleContextMenuAction('copy')}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>이슈 복사</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>이슈 삭제</ListItemText>
        </MenuItem>
      </Menu>

      {/* Status sub-menu */}
      <Menu
        open={Boolean(statusSubMenuAnchor)}
        anchorEl={statusSubMenuAnchor}
        onClose={() => setStatusSubMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {(statusesQuery.data ?? []).map((s) => (
          <MenuItem
            key={s.id}
            onClick={() => { if (s.id != null) handleStatusChange(s.id); }}
            selected={contextMenu?.issue?.statusName === s.name}
          >
            {s.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Assignee sub-menu */}
      <Menu
        open={Boolean(assigneeSubMenuAnchor)}
        anchorEl={assigneeSubMenuAnchor}
        onClose={() => setAssigneeSubMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => handleAssigneeChange(null)}>
          <Typography color="text.secondary">미배정</Typography>
        </MenuItem>
        {(membersQuery.data ?? []).map((m) => (
          <MenuItem
            key={m.userId}
            onClick={() => { if (m.userId != null) handleAssigneeChange(m.userId); }}
          >
            {m.username}
          </MenuItem>
        ))}
      </Menu>

      {/* Priority sub-menu */}
      <Menu
        open={Boolean(prioritySubMenuAnchor)}
        anchorEl={prioritySubMenuAnchor}
        onClose={() => setPrioritySubMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {(prioritiesQuery.data ?? []).map((p) => (
          <MenuItem
            key={p.id}
            onClick={() => { if (p.id != null) handlePriorityChange(p.id); }}
            selected={contextMenu?.issue?.priorityName === p.name}
          >
            {p.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>이슈 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            이슈 #{deleteTargetIssue?.id} &quot;{deleteTargetIssue?.subject}&quot;을(를) 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteIssueMutation.isPending}
            startIcon={deleteIssueMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {deleteIssueMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy issue dialog */}
      {copyTargetIssue?.id != null && projectId != null && identifier != null && (
        <CopyIssueDialog
          open={copyIssueOpen}
          onClose={() => { setCopyIssueOpen(false); setCopyTargetIssue(null); }}
          issueId={copyTargetIssue.id}
          currentProjectId={projectId}
          currentProjectIdentifier={identifier}
          onSuccess={(message) => {
            setSnackbar({ open: true, message, severity: 'success' });
            queryClient.invalidateQueries({ queryKey: ['issues'] });
          }}
        />
      )}

      {/* Save filter dialog */}
      <Dialog open={saveFilterOpen} onClose={() => setSaveFilterOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>필터 저장</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="필터 이름"
              required
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              autoFocus
            />
            <FormControlLabel
              control={
                <Switch
                  checked={saveFilterPublic}
                  onChange={(e) => setSaveFilterPublic(e.target.checked)}
                />
              }
              label="공개 필터 (다른 사용자에게도 표시)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveFilterOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!saveFilterName.trim() || saveFilterMutation.isPending}
            onClick={handleSaveFilter}
          >
            {saveFilterMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV dialog */}
      <ImportIssuesDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        projectIdentifier={identifier ?? ''}
        onSuccess={(message) => setSnackbar({ open: true, message, severity: 'success' })}
      />

      {/* Snackbar for feedback */}
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
