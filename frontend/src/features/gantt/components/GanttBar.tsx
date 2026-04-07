import { useState, useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Tooltip, Typography, Box } from '@mui/material';

export interface GanttIssue {
  id: number;
  subject: string;
  trackerName: string | null;
  priorityName: string | null;
  assignedToName: string | null;
  statusName: string | null;
  parentIssueId: number | null;
  startDate: string;
  dueDate: string;
  doneRatio: number;
  relations: Array<{
    issueFromId: number;
    issueToId: number;
    relationType: string;
    delay: number;
  }>;
}

type DragMode = 'move' | 'resize-left' | 'resize-right' | null;

interface GanttBarProps {
  issue: GanttIssue;
  x: number;
  width: number;
  rowY: number;
  color: string;
  progressColor: string;
  onDragEnd?: (issueId: number, deltaStartDays: number, deltaDueDays: number) => void;
  onClick?: (issueId: number) => void;
  dayWidth: number;
}

const BAR_HEIGHT = 20;
const ROW_HEIGHT = 36;

export default function GanttBar({
  issue,
  x,
  width,
  rowY,
  color,
  progressColor,
  onDragEnd,
  onClick,
  dayWidth,
}: GanttBarProps) {
  const [dragOffset, setDragOffset] = useState({ dx: 0, dw: 0, mode: null as DragMode });
  const dragRef = useRef<{
    startMouseX: number;
    mode: DragMode;
  } | null>(null);
  const wasDragged = useRef(false);
  const groupRef = useRef<SVGGElement>(null);

  const barY = rowY + (ROW_HEIGHT - BAR_HEIGHT) / 2;
  const progressWidth = Math.max(0, (width + dragOffset.dw) * (issue.doneRatio / 100));

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<SVGRectElement>, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { startMouseX: e.clientX, mode };
      wasDragged.current = false;

      const handleMouseMove = (ev: globalThis.MouseEvent) => {
        if (!dragRef.current) return;
        const deltaX = ev.clientX - dragRef.current.startMouseX;
        if (Math.abs(deltaX) > 3) wasDragged.current = true;

        // Direct DOM manipulation for smooth dragging (no React re-render)
        if (groupRef.current) {
          const currentMode = dragRef.current.mode;
          if (currentMode === 'move') {
            groupRef.current.style.transform = `translateX(${deltaX}px)`;
          } else if (currentMode === 'resize-right' || currentMode === 'resize-left') {
            // For resize, fall back to state (less frequent visual updates needed)
            setDragOffset({
              dx: currentMode === 'resize-left' ? deltaX : 0,
              dw: currentMode === 'resize-left' ? -deltaX : deltaX,
              mode: currentMode,
            });
          }
        }
      };

      const handleMouseUp = (ev: globalThis.MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (dragRef.current && onDragEnd) {
          const deltaX = ev.clientX - dragRef.current.startMouseX;
          const currentMode = dragRef.current.mode;
          const daysDelta = Math.round(deltaX / dayWidth);

          if (daysDelta !== 0) {
            if (currentMode === 'move') {
              onDragEnd(issue.id, daysDelta, daysDelta);
            } else if (currentMode === 'resize-right') {
              onDragEnd(issue.id, 0, daysDelta);
            } else if (currentMode === 'resize-left') {
              onDragEnd(issue.id, daysDelta, 0);
            }
          }
        }

        dragRef.current = null;
        setDragOffset({ dx: 0, dw: 0, mode: null });
        if (groupRef.current) groupRef.current.style.transform = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [dayWidth, issue.id, onDragEnd],
  );

  const handleClick = useCallback(
    (e: ReactMouseEvent) => {
      if (wasDragged.current) return;
      e.stopPropagation();
      onClick?.(issue.id);
    },
    [issue.id, onClick],
  );

  const currentX = x + dragOffset.dx;
  const currentWidth = Math.max(dayWidth * 0.5, width + dragOffset.dw);

  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        #{issue.id} {issue.subject}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        트래커: {issue.trackerName ?? '-'}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        상태: {issue.statusName ?? '-'}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        담당자: {issue.assignedToName ?? '미배정'}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        우선순위: {issue.priorityName ?? '-'}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        진행률: {issue.doneRatio}%
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        기간: {issue.startDate} ~ {issue.dueDate}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top" enterDelay={300}>
      <g ref={groupRef} style={{ cursor: dragOffset.mode ? 'grabbing' : 'pointer', willChange: 'transform' }}>
        {/* Main bar background */}
        <rect
          x={currentX}
          y={barY}
          width={currentWidth}
          height={BAR_HEIGHT}
          rx={4}
          ry={4}
          fill={color}
          opacity={0.7}
          onClick={handleClick}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
          style={{ cursor: dragOffset.mode === 'move' ? 'grabbing' : 'grab' }}
        />
        {/* Progress fill */}
        {issue.doneRatio > 0 && (
          <rect
            x={currentX}
            y={barY}
            width={Math.min(progressWidth, currentWidth)}
            height={BAR_HEIGHT}
            rx={4}
            ry={4}
            fill={progressColor}
            opacity={0.9}
            onClick={handleClick}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            style={{ pointerEvents: 'none' }}
          />
        )}
        {/* Clip progress bar right edge when not 100% */}
        {issue.doneRatio > 0 && issue.doneRatio < 100 && (
          <rect
            x={currentX + progressWidth - 4}
            y={barY}
            width={4}
            height={BAR_HEIGHT}
            fill={progressColor}
            opacity={0.9}
            style={{ pointerEvents: 'none' }}
          />
        )}
        {/* Left resize handle */}
        <rect
          x={currentX}
          y={barY}
          width={6}
          height={BAR_HEIGHT}
          fill="transparent"
          onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
          style={{ cursor: 'ew-resize' }}
        />
        {/* Right resize handle */}
        <rect
          x={currentX + currentWidth - 6}
          y={barY}
          width={6}
          height={BAR_HEIGHT}
          fill="transparent"
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
          style={{ cursor: 'ew-resize' }}
        />
        {/* Subject label inside bar (if wide enough) */}
        {currentWidth > 60 && (
          <text
            x={currentX + 6}
            y={barY + BAR_HEIGHT / 2}
            dy="0.35em"
            fontSize={11}
            fill="#fff"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <tspan>
              {issue.subject.length > Math.floor(currentWidth / 7)
                ? issue.subject.slice(0, Math.floor(currentWidth / 7) - 2) + '...'
                : issue.subject}
            </tspan>
          </text>
        )}
      </g>
    </Tooltip>
  );
}
