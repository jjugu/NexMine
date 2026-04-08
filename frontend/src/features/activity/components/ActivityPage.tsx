import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Skeleton, TablePagination,
  ToggleButton, ToggleButtonGroup, Alert, Avatar,
  useMediaQuery, useTheme, Breadcrumbs, Link,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HistoryIcon from '@mui/icons-material/History';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import axiosInstance from '../../../api/axiosInstance';
import type { ActivityDto } from '../../../api/generated/model/activityDto';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface ActivityPagedResult {
  items: ActivityDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

type FilterType = 'all' | 'issue' | 'wiki' | 'document';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'issue', label: '이슈' },
  { value: 'wiki', label: '위키' },
  { value: 'document', label: '문서' },
];

function getActivityIcon(type: string | null | undefined) {
  switch (type) {
    case 'issue_created':
      return <BugReportIcon fontSize="small" />;
    case 'issue_updated':
      return <EditIcon fontSize="small" />;
    case 'wiki_edited':
      return <DescriptionIcon fontSize="small" />;
    case 'document_created':
      return <AttachFileIcon fontSize="small" />;
    default:
      return <HistoryIcon fontSize="small" />;
  }
}

function getActivityIconColor(type: string | null | undefined): string {
  switch (type) {
    case 'issue_created':
      return '#1976d2';
    case 'issue_updated':
      return '#ed6c02';
    case 'wiki_edited':
      return '#9c27b0';
    case 'document_created':
      return '#2e7d32';
    default:
      return '#757575';
  }
}

function getActivityText(activity: ActivityDto): string {
  const userName = activity.userName ?? '알 수 없는 사용자';
  switch (activity.type) {
    case 'issue_created':
      return `${userName}이(가) 이슈 #${activity.issueId} '${activity.issueSubject ?? ''}'을(를) 생성했습니다`;
    case 'issue_updated':
      return `${userName}이(가) 이슈 #${activity.issueId} '${activity.issueSubject ?? ''}'을(를) 수정했습니다`;
    case 'wiki_edited':
      return `${userName}이(가) 위키 '${activity.wikiTitle ?? ''}'을(를) 편집했습니다`;
    case 'document_created':
      return `${userName}이(가) 문서 '${activity.documentTitle ?? ''}'을(를) 등록했습니다`;
    default:
      return `${userName}이(가) 활동을 수행했습니다`;
  }
}

function getActivityLink(activity: ActivityDto): string | null {
  const identifier = activity.projectIdentifier;
  if (!identifier) return null;

  switch (activity.type) {
    case 'issue_created':
    case 'issue_updated':
      return activity.issueId
        ? `/projects/${identifier}/issues/${activity.issueId}`
        : null;
    case 'wiki_edited':
      return activity.wikiSlug
        ? `/projects/${identifier}/wiki/${activity.wikiSlug}`
        : null;
    case 'document_created':
      return activity.documentId
        ? `/projects/${identifier}/documents/${activity.documentId}`
        : null;
    default:
      return null;
  }
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const now = dayjs();
  const date = dayjs(dateStr);
  const diffMinutes = now.diff(date, 'minute');

  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = now.diff(date, 'hour');
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = now.diff(date, 'day');
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.format('YYYY-MM-DD');
}

function getApiTypeParam(filter: FilterType): string | undefined {
  if (filter === 'all') return undefined;
  return filter;
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<{ id?: number; name?: string | null; identifier?: string | null }>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function ActivityPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { identifier } = useParams<{ identifier?: string }>();
  const isProjectScope = !!identifier;

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: isProjectScope && !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError } = useQuery({
    queryKey: isProjectScope
      ? ['activities', identifier, { page, pageSize, type: filter }]
      : ['activities', { page, pageSize, type: filter }],
    queryFn: () => {
      const params = {
        Page: page,
        PageSize: pageSize,
        Type: getApiTypeParam(filter),
      };
      const url = isProjectScope
        ? `/projects/${identifier}/activities`
        : '/activities';
      return axiosInstance.get<ActivityPagedResult>(url, { params }).then((r) => r.data);
    },
    ...(isProjectScope ? { enabled: !!identifier } : {}),
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, newFilter: FilterType | null) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setPage(newPage + 1);
    },
    [],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPageSize(parseInt(event.target.value, 10));
      setPage(1);
    },
    [],
  );

  const handleActivityClick = (activity: ActivityDto) => {
    const link = getActivityLink(activity);
    if (link) {
      navigate(link);
    }
  };

  const renderSkeleton = () => (
    <Box>
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, p: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" sx={{ width: '70%' }} />
            <Skeleton variant="text" sx={{ width: '40%' }} />
          </Box>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      {isProjectScope && (
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate('/projects')}
          >
            프로젝트
          </Link>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate(`/projects/${identifier}`)}
          >
            {projectQuery.data?.name ?? identifier}
          </Link>
          <Typography color="text.primary">활동</Typography>
        </Breadcrumbs>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">
          {isProjectScope ? '프로젝트 활동' : '활동'}
        </Typography>
      </Box>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilterChange}
        size="small"
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <ToggleButton
            key={opt.value}
            value={opt.value}
            sx={{ textTransform: 'none', px: isMobile ? 1.5 : 2 }}
          >
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          활동 목록을 불러오는 중 오류가 발생했습니다.
        </Alert>
      ) : isLoading ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">최근 활동이 없습니다</Typography>
        </Paper>
      ) : (
        <>
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            {items.map((activity, index) => {
              const link = getActivityLink(activity);
              const iconColor = getActivityIconColor(activity.type);
              return (
                <Box
                  key={`${activity.type}-${activity.createdAt}-${index}`}
                  onClick={() => handleActivityClick(activity)}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 2,
                    cursor: link ? 'pointer' : 'default',
                    borderBottom: index < items.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'background-color 0.15s',
                    '&:hover': link
                      ? { bgcolor: 'action.hover' }
                      : undefined,
                  }}
                >
                  {/* Timeline dot */}
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: `${iconColor}20`,
                      color: iconColor,
                      flexShrink: 0,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: 'break-word',
                      }}
                    >
                      {getActivityText(activity)}
                    </Typography>

                    {/* Description (for issue_updated notes) */}
                    {activity.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          pl: 1,
                          borderLeft: '2px solid',
                          borderColor: 'divider',
                          fontStyle: 'italic',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line',
                          maxHeight: 80,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {activity.description}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Show project name in global view */}
                      {!isProjectScope && activity.projectName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            bgcolor: 'action.selected',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                          }}
                        >
                          {activity.projectName}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {formatRelativeTime(activity.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Paper>

          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="페이지당 항목 수"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count !== -1 ? count : `${to} 이상`}`
            }
          />
        </>
      )}
    </Box>
  );
}
