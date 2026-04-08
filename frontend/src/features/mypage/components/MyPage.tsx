import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Badge,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Avatar, IconButton, Tooltip, Link as MuiLink,
  useMediaQuery, useTheme, CardActionArea,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import axiosInstance from '../../../api/axiosInstance';
import { QueryState, DashboardSkeleton } from '../../../components/common/QueryState';
import WidgetManagerDialog from './WidgetManagerDialog';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// --- Types ---

interface MyPageIssueDto {
  id: number;
  subject: string;
  projectName: string;
  projectIdentifier: string;
  statusName: string;
  priorityName: string;
  assigneeName?: string | null;
  dueDate?: string | null;
  doneRatio: number;
  updatedAt: string;
}

interface ActivityItem {
  type: string;
  title: string;
  description?: string | null;
  projectName: string;
  projectIdentifier: string;
  userName: string;
  createdAt: string;
  issueId?: number | null;
}

interface CalendarEvent {
  issueId: number;
  subject: string;
  projectIdentifier: string;
  startDate?: string | null;
  dueDate?: string | null;
}

interface MyPageWidget {
  id: number;
  widgetType: string;
  position: number;
  column: number;
}

interface MyPageData {
  myIssues?: { totalCount: number; issues: MyPageIssueDto[] };
  watchedIssues?: { totalCount: number; issues: MyPageIssueDto[] };
  recentActivity?: { items: ActivityItem[] };
  overdueIssues?: { totalCount: number; issues: MyPageIssueDto[] };
  timeEntries?: { todayHours: number; weekHours: number; monthHours: number };
  calendar?: { events: CalendarEvent[] };
}

interface MyPageDto {
  widgets: MyPageWidget[];
  data: MyPageData;
}

// --- Helpers ---

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${y}. ${m}. ${d}.`;
  }
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(s).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const now = dayjs();
  const date = dayjs(s);
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

function getPriorityChipColor(name?: string): 'error' | 'warning' | 'info' | 'default' {
  if (!name) return 'default';
  const n = name.toLowerCase();
  if (n === 'immediate' || n === '긴급' || n === 'urgent' || n === '매우높음') return 'error';
  if (n === 'high' || n === '높음') return 'warning';
  if (n === 'normal' || n === '보통') return 'info';
  return 'default';
}

function getActivityIcon(type: string) {
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

function getActivityIconColor(type: string): string {
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

function isDueDateOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), 'day');
}

// --- Widget renderers ---

interface IssueListWidgetProps {
  title: string;
  totalCount: number;
  issues: MyPageIssueDto[];
  badgeColor?: 'primary' | 'error';
  highlightDueDate?: boolean;
  isMobile: boolean;
  onNavigate: (path: string) => void;
}

function IssueListWidget({
  title,
  totalCount,
  issues,
  badgeColor = 'primary',
  highlightDueDate = false,
  isMobile,
  onNavigate,
}: IssueListWidgetProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Badge badgeContent={totalCount} color={badgeColor} max={999}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, pr: 1 }}>
              {title}
            </Typography>
          </Badge>
        </Box>

        {issues.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              이슈가 없습니다
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {issues.map((issue) => (
              <Card key={issue.id} variant="outlined" sx={{ '&:hover': { borderColor: 'primary.main' } }}>
                <CardActionArea
                  onClick={() => onNavigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)}
                >
                  <CardContent sx={{ py: 1, px: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          #{issue.id} - {issue.projectName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {issue.subject}
                        </Typography>
                      </Box>
                      <Chip
                        label={issue.priorityName}
                        size="small"
                        color={getPriorityChipColor(issue.priorityName)}
                        variant="outlined"
                      />
                    </Box>
                    {highlightDueDate && issue.dueDate && (
                      <Typography
                        variant="caption"
                        sx={{ color: isDueDateOverdue(issue.dueDate) ? 'error.main' : 'text.secondary' }}
                      >
                        기한: {formatDate(issue.dueDate)}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>프로젝트</TableCell>
                  <TableCell>#</TableCell>
                  <TableCell>제목</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>우선순위</TableCell>
                  <TableCell>기한</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onNavigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                        {issue.projectName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {issue.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {issue.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={issue.statusName} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.priorityName}
                        size="small"
                        color={getPriorityChipColor(issue.priorityName)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: highlightDueDate && isDueDateOverdue(issue.dueDate)
                            ? 'error.main'
                            : 'text.secondary',
                          fontWeight: highlightDueDate && isDueDateOverdue(issue.dueDate) ? 600 : 400,
                        }}
                      >
                        {formatDate(issue.dueDate)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget({ items, onNavigate }: { items: ActivityItem[]; onNavigate: (path: string) => void }) {
  const displayItems = items.slice(0, 10);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          최근 활동
        </Typography>

        {displayItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              최근 활동이 없습니다
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {displayItems.map((item, index) => {
              const iconColor = getActivityIconColor(item.type);
              const isClickable = !!item.issueId;
              return (
                <Box
                  key={`${item.type}-${item.createdAt}-${index}`}
                  onClick={() => {
                    if (item.issueId) {
                      onNavigate(`/projects/${item.projectIdentifier}/issues/${item.issueId}`);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    py: 1,
                    cursor: isClickable ? 'pointer' : 'default',
                    borderBottom: index < displayItems.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:hover': isClickable ? { bgcolor: 'action.hover' } : undefined,
                    borderRadius: 0.5,
                    px: 0.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: `${iconColor}20`,
                      color: iconColor,
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {getActivityIcon(item.type)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.userName}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatRelativeTime(item.createdAt)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ bgcolor: 'action.selected', px: 0.5, borderRadius: 0.5 }}
                      >
                        {item.projectName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function TimeEntriesWidget({ todayHours, weekHours, monthHours }: { todayHours: number; weekHours: number; monthHours: number }) {
  const stats = [
    { label: '오늘', value: todayHours },
    { label: '이번 주', value: weekHours },
    { label: '이번 달', value: monthHours },
  ];

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          시간 기록 요약
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', py: 1 }}>
          {stats.map((stat) => (
            <Box key={stat.label}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stat.value.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label} (시간)
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function CalendarWidget({ events, onNavigate }: { events: CalendarEvent[]; onNavigate: (path: string) => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          이번 달 일정
        </Typography>

        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CalendarMonthIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              이번 달 일정이 없습니다
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {events.map((event) => {
              const dateLabel = event.dueDate
                ? formatDate(event.dueDate)
                : event.startDate
                  ? formatDate(event.startDate)
                  : '-';
              return (
                <Box
                  key={`${event.issueId}-${event.startDate}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    px: 1,
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => onNavigate(`/projects/${event.projectIdentifier}/issues/${event.issueId}`)}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
                    {dateLabel}
                  </Typography>
                  <MuiLink
                    component="span"
                    variant="body2"
                    underline="hover"
                    sx={{ cursor: 'pointer' }}
                  >
                    #{event.issueId} {event.subject}
                  </MuiLink>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// --- Widget type config ---

// --- Main component ---

export default function MyPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [managerOpen, setManagerOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-page'],
    queryFn: () => axiosInstance.get<MyPageDto>('/my/page').then((r) => r.data),
  });

  const widgets = data?.widgets ?? [];
  const pageData = data?.data ?? {};

  const leftWidgets = widgets
    .filter((w) => w.column === 0)
    .sort((a, b) => a.position - b.position);
  const rightWidgets = widgets
    .filter((w) => w.column === 1)
    .sort((a, b) => a.position - b.position);

  function renderWidget(widget: MyPageWidget) {
    const { widgetType } = widget;
    const handleNavigate = (path: string) => navigate(path);

    switch (widgetType) {
      case 'my_issues':
        return (
          <IssueListWidget
            key={widget.id}
            title="내게 할당된 이슈"
            totalCount={pageData.myIssues?.totalCount ?? 0}
            issues={pageData.myIssues?.issues ?? []}
            isMobile={isMobile}
            onNavigate={handleNavigate}
          />
        );

      case 'watched_issues':
        return (
          <IssueListWidget
            key={widget.id}
            title="감시 중인 이슈"
            totalCount={pageData.watchedIssues?.totalCount ?? 0}
            issues={pageData.watchedIssues?.issues ?? []}
            isMobile={isMobile}
            onNavigate={handleNavigate}
          />
        );

      case 'overdue_issues':
        return (
          <IssueListWidget
            key={widget.id}
            title="기한 초과 이슈"
            totalCount={pageData.overdueIssues?.totalCount ?? 0}
            issues={pageData.overdueIssues?.issues ?? []}
            badgeColor="error"
            highlightDueDate
            isMobile={isMobile}
            onNavigate={handleNavigate}
          />
        );

      case 'recent_activity':
        return (
          <RecentActivityWidget
            key={widget.id}
            items={pageData.recentActivity?.items ?? []}
            onNavigate={handleNavigate}
          />
        );

      case 'time_entries':
        return (
          <TimeEntriesWidget
            key={widget.id}
            todayHours={pageData.timeEntries?.todayHours ?? 0}
            weekHours={pageData.timeEntries?.weekHours ?? 0}
            monthHours={pageData.timeEntries?.monthHours ?? 0}
          />
        );

      case 'calendar':
        return (
          <CalendarWidget
            key={widget.id}
            events={pageData.calendar?.events ?? []}
            onNavigate={handleNavigate}
          />
        );

      default:
        return null;
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">내 페이지</Typography>
        <Tooltip title="위젯 관리">
          <IconButton onClick={() => setManagerOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorMessage="내 페이지 데이터를 불러오는데 실패했습니다."
        skeleton={<DashboardSkeleton />}
      >
        {widgets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              표시할 위젯이 없습니다. 위젯 관리 버튼을 눌러 위젯을 추가하세요.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {/* Left column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {leftWidgets.map((w) => renderWidget(w))}
              </Box>
            </Grid>
            {/* Right column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rightWidgets.map((w) => renderWidget(w))}
              </Box>
            </Grid>
          </Grid>
        )}
      </QueryState>

      <WidgetManagerDialog
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        currentWidgets={widgets}
      />
    </Box>
  );
}
