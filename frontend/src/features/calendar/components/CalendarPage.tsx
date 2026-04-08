import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Breadcrumbs, Link, Button, ButtonGroup,
  Skeleton, Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, DatesSetArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import dayjs from 'dayjs';
import axiosInstance from '../../../api/axiosInstance';

interface ProjectDto {
  id?: number;
  name?: string | null;
  identifier?: string | null;
}

interface CalendarEvent {
  id: number;
  subject: string;
  trackerName: string | null;
  priorityName: string | null;
  trackerId: number;
  priorityId: number;
  startDate: string | null;
  dueDate: string | null;
  isClosed: boolean;
}

type ColorMode = 'tracker' | 'priority';

const TRACKER_COLORS: Record<string, string> = {
  'Bug': '#ef5350',
  '버그': '#ef5350',
  'Feature': '#42a5f5',
  '기능': '#42a5f5',
  'Task': '#66bb6a',
  '작업': '#66bb6a',
  'Support': '#ffa726',
  '지원': '#ffa726',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Immediate': '#ef5350',
  '즉시': '#ef5350',
  'Urgent': '#ed6c02',
  '긴급': '#ed6c02',
  'High': '#ffa000',
  '높음': '#ffa000',
  'Normal': '#42a5f5',
  '보통': '#42a5f5',
  'Low': '#bdbdbd',
  '낮음': '#bdbdbd',
};

function getColor(issue: CalendarEvent, colorMode: ColorMode): string {
  if (colorMode === 'tracker') {
    return TRACKER_COLORS[issue.trackerName ?? ''] ?? '#90a4ae';
  }
  return PRIORITY_COLORS[issue.priorityName ?? ''] ?? '#90a4ae';
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<ProjectDto>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

function fetchCalendarData(identifier: string, start: string, end: string) {
  return axiosInstance
    .get<CalendarEvent[]>(`/projects/${identifier}/calendar`, {
      params: { start, end },
    })
    .then((res) => res.data);
}

function mapToEvents(issues: CalendarEvent[], colorMode: ColorMode): EventInput[] {
  return issues
    .filter((i) => i.startDate || i.dueDate)
    .map((issue) => ({
      id: String(issue.id),
      title: `#${issue.id} ${issue.subject}`,
      start: issue.startDate ?? issue.dueDate ?? undefined,
      end: issue.dueDate
        ? dayjs(issue.dueDate).add(1, 'day').format('YYYY-MM-DD')
        : undefined,
      color: getColor(issue, colorMode),
      textColor: '#fff',
      extendedProps: { issue },
    }));
}

export default function CalendarPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const [colorMode, setColorMode] = useState<ColorMode>('tracker');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = dayjs();
    return {
      start: now.startOf('month').format('YYYY-MM-DD'),
      end: now.endOf('month').format('YYYY-MM-DD'),
    };
  });

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const calendarQuery = useQuery({
    queryKey: ['calendar', identifier, dateRange.start, dateRange.end],
    queryFn: () => fetchCalendarData(identifier!, dateRange.start, dateRange.end),
    enabled: !!identifier,
    placeholderData: (prev) => prev,
  });

  const calendarEvents = useMemo(
    () => mapToEvents(calendarQuery.data ?? [], colorMode),
    [calendarQuery.data, colorMode],
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const start = dayjs(arg.start).format('YYYY-MM-DD');
      const end = dayjs(arg.end).format('YYYY-MM-DD');
      setDateRange({ start, end });
    },
    [],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const issueId = arg.event.id;
      navigate(`/projects/${identifier}/issues/${issueId}`);
    },
    [identifier, navigate],
  );

  const handleDateClick = useCallback(
    (_arg: DateClickArg) => {
      navigate(`/projects/${identifier}/issues/new`);
    },
    [identifier, navigate],
  );

  const handleEventDrop = useCallback(
    (arg: EventDropArg) => {
      const issueId = arg.event.id;
      const issue = arg.event.extendedProps.issue as CalendarEvent;

      const newStart = arg.event.start
        ? dayjs(arg.event.start).format('YYYY-MM-DD')
        : issue.startDate;
      const newEnd = arg.event.end
        ? dayjs(arg.event.end).subtract(1, 'day').format('YYYY-MM-DD')
        : newStart;

      axiosInstance
        .put(`/Issues/${issueId}`, {
          startDate: newStart,
          dueDate: newEnd,
        })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ['calendar', identifier],
          });
        })
        .catch((err) => {
          console.error('캘린더 이벤트 이동 실패:', err);
          arg.revert();
        });
    },
    [identifier, queryClient],
  );

  const handleEventResize = useCallback(
    (arg: EventResizeDoneArg) => {
      const issueId = arg.event.id;

      const newEnd = arg.event.end
        ? dayjs(arg.event.end).subtract(1, 'day').format('YYYY-MM-DD')
        : null;

      if (!newEnd) return;

      axiosInstance
        .put(`/Issues/${issueId}`, {
          dueDate: newEnd,
        })
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ['calendar', identifier],
          });
        })
        .catch((err) => {
          console.error('캘린더 이벤트 크기 조정 실패:', err);
          arg.revert();
        });
    },
    [identifier, queryClient],
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar', identifier] });
  }, [identifier, queryClient]);

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
          <Typography color="text.primary">캘린더</Typography>
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
          <Typography variant="h5">캘린더</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Color mode toggle */}
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={colorMode === 'tracker' ? 'contained' : 'outlined'}
                onClick={() => setColorMode('tracker')}
              >
                트래커별
              </Button>
              <Button
                variant={colorMode === 'priority' ? 'contained' : 'outlined'}
                onClick={() => setColorMode('priority')}
              >
                우선순위별
              </Button>
            </ButtonGroup>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size="small"
            >
              새로고침
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error */}
      {calendarQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          캘린더 데이터를 불러오는데 실패했습니다.
        </Alert>
      )}

      {/* Loading */}
      {calendarQuery.isLoading && !calendarQuery.data && (
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {/* Calendar */}
      <Box
        sx={{
          flex: 1,
          '& .fc': {
            fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
          },
          '& .fc-toolbar-title': {
            fontSize: { xs: '1rem', sm: '1.25rem' },
          },
          '& .fc-button': {
            textTransform: 'none',
          },
          '& .fc-event': {
            cursor: 'pointer',
            borderRadius: '4px',
            border: 'none',
            px: 0.5,
          },
          '& .fc-daygrid-event': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          '& .fc-day-today': {
            bgcolor: 'rgba(25, 118, 210, 0.04) !important',
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          events={calendarEvents}
          editable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          height="auto"
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
          }}
          dayMaxEvents={4}
          moreLinkText={(n) => `+${n}개 더보기`}
          noEventsText="이벤트 없음"
          allDayText="종일"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false,
          }}
        />
      </Box>
    </Box>
  );
}
