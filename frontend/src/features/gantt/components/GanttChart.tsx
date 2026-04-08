import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import GanttBar from './GanttBar';
import type { GanttIssue } from './GanttBar';

dayjs.extend(isoWeek);

export type ViewMode = 'day' | 'week' | 'month';

interface GanttChartProps {
  issues: GanttIssue[];
  viewMode: ViewMode;
  onBarClick?: (issueId: number) => void;
  onBarDrag?: (issueId: number, deltaStartDays: number, deltaDueDays: number) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 48;
const LEFT_PANEL_WIDTH = 300;

function getColumnWidth(viewMode: ViewMode): number {
  switch (viewMode) {
    case 'day': return 40;
    case 'week': return 120;
    case 'month': return 200;
  }
}

function getTrackerColor(trackerName: string | null): { bg: string; progress: string } {
  const name = (trackerName ?? '').toLowerCase();
  if (name.includes('bug') || name === '버그') return { bg: '#ef5350', progress: '#c62828' };
  if (name.includes('feature') || name === '기능') return { bg: '#42a5f5', progress: '#1565c0' };
  if (name.includes('support') || name === '지원') return { bg: '#ffa726', progress: '#e65100' };
  // Default: Task / 작업
  return { bg: '#66bb6a', progress: '#2e7d32' };
}

interface TimelineColumn {
  label: string;
  date: Dayjs;
  width: number;
}

function computeTimeline(
  issues: GanttIssue[],
  viewMode: ViewMode,
): { columns: TimelineColumn[]; startDate: Dayjs; endDate: Dayjs } {
  if (issues.length === 0) {
    const today = dayjs();
    const start = today.subtract(7, 'day');
    const end = today.add(30, 'day');
    return buildColumns(start, end, viewMode);
  }

  let minDate = dayjs(issues[0].startDate);
  let maxDate = dayjs(issues[0].dueDate);

  for (const issue of issues) {
    const s = dayjs(issue.startDate);
    const d = dayjs(issue.dueDate);
    if (s.isBefore(minDate)) minDate = s;
    if (d.isAfter(maxDate)) maxDate = d;
  }

  // Add padding
  const start = minDate.subtract(3, 'day');
  const end = maxDate.add(7, 'day');

  return buildColumns(start, end, viewMode);
}

function buildColumns(
  start: Dayjs,
  end: Dayjs,
  viewMode: ViewMode,
): { columns: TimelineColumn[]; startDate: Dayjs; endDate: Dayjs } {
  const colWidth = getColumnWidth(viewMode);
  const columns: TimelineColumn[] = [];

  if (viewMode === 'day') {
    let current = start.startOf('day');
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      columns.push({
        label: current.format('M/D'),
        date: current,
        width: colWidth,
      });
      current = current.add(1, 'day');
    }
  } else if (viewMode === 'week') {
    let current = start.startOf('isoWeek');
    while (current.isBefore(end)) {
      columns.push({
        label: `W${current.isoWeek()}`,
        date: current,
        width: colWidth,
      });
      current = current.add(1, 'week');
    }
  } else {
    let current = start.startOf('month');
    while (current.isBefore(end)) {
      columns.push({
        label: current.format('YYYY-MM'),
        date: current,
        width: colWidth,
      });
      current = current.add(1, 'month');
    }
  }

  return {
    columns,
    startDate: columns.length > 0 ? columns[0].date : start,
    endDate: columns.length > 0 ? columns[columns.length - 1].date : end,
  };
}

function getBarPosition(
  issue: GanttIssue,
  timelineStartDate: Dayjs,
  viewMode: ViewMode,
): { x: number; width: number } {
  const colWidth = getColumnWidth(viewMode);
  const issueStart = dayjs(issue.startDate);
  const issueEnd = dayjs(issue.dueDate);

  if (viewMode === 'day') {
    const startOffset = issueStart.diff(timelineStartDate.startOf('day'), 'day');
    const duration = issueEnd.diff(issueStart, 'day') + 1;
    return { x: startOffset * colWidth, width: Math.max(duration * colWidth, colWidth * 0.5) };
  } else if (viewMode === 'week') {
    const timelineStart = timelineStartDate.startOf('isoWeek');
    const startDays = issueStart.diff(timelineStart, 'day');
    const duration = issueEnd.diff(issueStart, 'day') + 1;
    const pixelsPerDay = colWidth / 7;
    return { x: startDays * pixelsPerDay, width: Math.max(duration * pixelsPerDay, colWidth * 0.1) };
  } else {
    // Month view: approximate with days
    const timelineStart = timelineStartDate.startOf('month');
    const startDays = issueStart.diff(timelineStart, 'day');
    const duration = issueEnd.diff(issueStart, 'day') + 1;
    const avgDaysPerMonth = 30;
    const pixelsPerDay = colWidth / avgDaysPerMonth;
    return { x: startDays * pixelsPerDay, width: Math.max(duration * pixelsPerDay, colWidth * 0.1) };
  }
}

function getDayWidth(viewMode: ViewMode): number {
  const colWidth = getColumnWidth(viewMode);
  if (viewMode === 'day') return colWidth;
  if (viewMode === 'week') return colWidth / 7;
  return colWidth / 30;
}

export default function GanttChart({
  issues,
  viewMode,
  onBarClick,
  onBarDrag,
  todayRef,
}: GanttChartProps) {
  const muiTheme = useTheme();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [_syncTrigger, setSyncTrigger] = useState(0);

  const { columns, startDate } = useMemo(
    () => computeTimeline(issues, viewMode),
    [issues, viewMode],
  );

  const totalWidth = useMemo(
    () => columns.reduce((sum, c) => sum + c.width, 0),
    [columns],
  );

  const totalHeight = issues.length * ROW_HEIGHT;
  const dayWidth = getDayWidth(viewMode);

  // Today position
  const today = dayjs();
  const todayX = useMemo(() => {
    if (viewMode === 'day') {
      return today.diff(startDate.startOf('day'), 'day') * getColumnWidth(viewMode);
    } else if (viewMode === 'week') {
      const days = today.diff(startDate.startOf('isoWeek'), 'day');
      return days * (getColumnWidth(viewMode) / 7);
    } else {
      const days = today.diff(startDate.startOf('month'), 'day');
      return days * (getColumnWidth(viewMode) / 30);
    }
  }, [today, startDate, viewMode]);

  // Sync vertical scroll between left and right panels
  const handleRightScroll = useCallback(() => {
    if (rightPanelRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  }, []);

  const handleLeftScroll = useCallback(() => {
    if (leftPanelRef.current && rightPanelRef.current) {
      rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  }, []);

  // Scroll to today on mount or viewMode change
  useEffect(() => {
    setSyncTrigger((v) => v + 1);
    if (todayRef?.current && rightPanelRef.current) {
      const containerWidth = rightPanelRef.current.clientWidth;
      const scrollTo = Math.max(0, todayX - containerWidth / 3);
      rightPanelRef.current.scrollLeft = scrollTo;
    }
  }, [viewMode, todayX, todayRef]);

  // Dependency arrows (precedes relations)
  const arrows = useMemo(() => {
    const issueMap = new Map(issues.map((iss, idx) => [iss.id, { issue: iss, index: idx }]));
    const result: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      isViolated: boolean;
    }> = [];

    for (const issue of issues) {
      for (const rel of issue.relations) {
        if (rel.relationType !== 'precedes') continue;
        const fromData = issueMap.get(rel.issueFromId);
        const toData = issueMap.get(rel.issueToId);
        if (!fromData || !toData) continue;

        const fromPos = getBarPosition(fromData.issue, startDate, viewMode);
        const toPos = getBarPosition(toData.issue, startDate, viewMode);

        const fromX = fromPos.x + fromPos.width;
        const fromY = fromData.index * ROW_HEIGHT + ROW_HEIGHT / 2;
        const toX = toPos.x;
        const toY = toData.index * ROW_HEIGHT + ROW_HEIGHT / 2;

        // Violation check: toIssue starts before fromIssue ends
        const isViolated = dayjs(toData.issue.startDate).isBefore(dayjs(fromData.issue.dueDate));

        result.push({ fromX, fromY, toX, toY, isViolated });
      }
    }
    return result;
  }, [issues, startDate, viewMode]);

  return (
    <Box
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        height: 'calc(100vh - 220px)',
        minHeight: 400,
      }}
    >
      {/* Left panel: issue list */}
      <Box
        ref={leftPanelRef}
        onScroll={handleLeftScroll}
        sx={{
          width: LEFT_PANEL_WIDTH,
          minWidth: LEFT_PANEL_WIDTH,
          borderRight: '2px solid',
          borderColor: 'divider',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {/* Left header */}
        <Box
          sx={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            px: 1,
          }}
        >
          <Typography variant="caption" sx={{ width: 40, fontWeight: 600, flexShrink: 0 }}>
            #
          </Typography>
          <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, minWidth: 0 }}>
            제목
          </Typography>
          <Typography variant="caption" sx={{ width: 70, fontWeight: 600, flexShrink: 0, textAlign: 'right' }}>
            담당자
          </Typography>
        </Box>
        {/* Issue rows */}
        {issues.map((issue) => (
          <Box
            key={issue.id}
            sx={{
              height: ROW_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => onBarClick?.(issue.id)}
          >
            <Typography variant="caption" sx={{ width: 40, flexShrink: 0, color: 'text.secondary' }}>
              {issue.id}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {issue.subject}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                width: 70,
                flexShrink: 0,
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.secondary',
              }}
            >
              {issue.assignedToName ?? '-'}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Right panel: SVG timeline */}
      <Box
        ref={rightPanelRef}
        onScroll={handleRightScroll}
        sx={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <svg
          width={Math.max(totalWidth, 800)}
          height={HEADER_HEIGHT + totalHeight}
          style={{ display: 'block', minWidth: '100%' }}
        >
          {/* Background grid */}
          <g>
            {/* Header background */}
            <rect
              x={0}
              y={0}
              width={Math.max(totalWidth, 800)}
              height={HEADER_HEIGHT}
              fill={muiTheme.palette.background.default}
            />
            {/* Column headers and vertical lines */}
            {(() => {
              let cumulX = 0;
              return columns.map((col, idx) => {
                const colX = cumulX;
                cumulX += col.width;
                const isWeekend =
                  viewMode === 'day' && (col.date.day() === 0 || col.date.day() === 6);
                return (
                  <g key={idx}>
                    {/* Weekend highlight */}
                    {isWeekend && (
                      <rect
                        x={colX}
                        y={HEADER_HEIGHT}
                        width={col.width}
                        height={totalHeight}
                        fill={muiTheme.palette.action.hover}
                        opacity={0.5}
                      />
                    )}
                    {/* Header label */}
                    <text
                      x={colX + col.width / 2}
                      y={HEADER_HEIGHT / 2}
                      dy="0.35em"
                      textAnchor="middle"
                      fontSize={11}
                      fill={muiTheme.palette.text.secondary}
                      style={{ userSelect: 'none' }}
                    >
                      {col.label}
                    </text>
                    {/* Vertical grid line */}
                    <line
                      x1={colX}
                      y1={HEADER_HEIGHT}
                      x2={colX}
                      y2={HEADER_HEIGHT + totalHeight}
                      stroke={muiTheme.palette.divider}
                      strokeWidth={0.5}
                    />
                  </g>
                );
              });
            })()}
            {/* Header bottom border */}
            <line
              x1={0}
              y1={HEADER_HEIGHT}
              x2={Math.max(totalWidth, 800)}
              y2={HEADER_HEIGHT}
              stroke={muiTheme.palette.divider}
              strokeWidth={1}
            />
            {/* Horizontal row lines */}
            {issues.map((_, idx) => (
              <line
                key={idx}
                x1={0}
                y1={HEADER_HEIGHT + (idx + 1) * ROW_HEIGHT}
                x2={Math.max(totalWidth, 800)}
                y2={HEADER_HEIGHT + (idx + 1) * ROW_HEIGHT}
                stroke={muiTheme.palette.divider}
                strokeWidth={0.5}
              />
            ))}
          </g>

          {/* Dependency arrows */}
          <defs>
            <marker
              id="arrowhead-grey"
              markerWidth={8}
              markerHeight={6}
              refX={8}
              refY={3}
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={muiTheme.palette.grey[500]} />
            </marker>
            <marker
              id="arrowhead-red"
              markerWidth={8}
              markerHeight={6}
              refX={8}
              refY={3}
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#ef5350" />
            </marker>
          </defs>
          {arrows.map((arrow, idx) => {
            const midX = (arrow.fromX + arrow.toX) / 2;
            const pathD = arrow.fromY === arrow.toY
              ? `M ${arrow.fromX} ${HEADER_HEIGHT + arrow.fromY} L ${arrow.toX} ${HEADER_HEIGHT + arrow.toY}`
              : `M ${arrow.fromX} ${HEADER_HEIGHT + arrow.fromY} C ${midX} ${HEADER_HEIGHT + arrow.fromY}, ${midX} ${HEADER_HEIGHT + arrow.toY}, ${arrow.toX} ${HEADER_HEIGHT + arrow.toY}`;
            return (
              <path
                key={idx}
                d={pathD}
                fill="none"
                stroke={arrow.isViolated ? '#ef5350' : muiTheme.palette.grey[500]}
                strokeWidth={1.5}
                markerEnd={arrow.isViolated ? 'url(#arrowhead-red)' : 'url(#arrowhead-grey)'}
              />
            );
          })}

          {/* Issue bars */}
          {issues.map((issue, idx) => {
            const { x, width } = getBarPosition(issue, startDate, viewMode);
            const { bg, progress } = getTrackerColor(issue.trackerName);
            return (
              <GanttBar
                key={issue.id}
                issue={issue}
                x={x}
                width={width}
                rowY={HEADER_HEIGHT + idx * ROW_HEIGHT}
                color={bg}
                progressColor={progress}
                dayWidth={dayWidth}
                onClick={onBarClick}
                onDragEnd={onBarDrag}
              />
            );
          })}

          {/* Today line */}
          {todayX >= 0 && todayX <= totalWidth && (
            <g>
              <line
                x1={todayX}
                y1={0}
                x2={todayX}
                y2={HEADER_HEIGHT + totalHeight}
                stroke="#ef5350"
                strokeWidth={2}
                strokeDasharray="6,3"
              />
              <rect
                x={todayX - 16}
                y={2}
                width={32}
                height={16}
                rx={3}
                fill="#ef5350"
              />
              <text
                x={todayX}
                y={10}
                dy="0.1em"
                textAnchor="middle"
                fontSize={10}
                fill="#fff"
                fontWeight={600}
                style={{ userSelect: 'none' }}
              >
                오늘
              </text>
            </g>
          )}
        </svg>
        {/* Hidden div for scrolling to today */}
        <div
          ref={todayRef}
          style={{
            position: 'absolute',
            left: todayX,
            top: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Box>
  );
}
