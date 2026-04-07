import { memo } from 'react';
import {
  Box, Typography, Chip, Avatar, LinearProgress, Card,
} from '@mui/material';
import type { DraggableProvided } from '@hello-pangea/dnd';

export interface KanbanIssue {
  id: number;
  subject: string;
  trackerName?: string | null;
  statusId: number;
  statusName?: string | null;
  priorityName?: string | null;
  assignedToName?: string | null;
  doneRatio: number;
  position: number;
}

function getPriorityBorderColor(priorityName?: string | null): string {
  if (!priorityName) return '#9e9e9e';
  const name = priorityName.toLowerCase();
  if (name === 'immediate' || name === '긴급') return '#d32f2f';
  if (name === 'urgent' || name === '매우높음') return '#ed6c02';
  if (name === 'high' || name === '높음') return '#ffa000';
  if (name === 'normal' || name === '보통') return '#1976d2';
  return '#9e9e9e';
}

interface KanbanCardProps {
  issue: KanbanIssue;
  provided: DraggableProvided;
  onClickIssue?: (issueId: number) => void;
}

export default memo(function KanbanCard({ issue, provided, onClickIssue }: KanbanCardProps) {

  const avatarLetter = issue.assignedToName
    ? issue.assignedToName[0].toUpperCase()
    : null;

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      variant="outlined"
      onClick={() => onClickIssue?.(issue.id)}
      sx={{
        mb: 1,
        cursor: 'pointer',
        borderLeft: `4px solid ${getPriorityBorderColor(issue.priorityName)}`,
        transition: 'box-shadow 0.15s ease',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <Box sx={{ p: 1.5 }}>
        {/* Header: issue number */}
        <Typography variant="caption" color="text.secondary">
          #{issue.id}
        </Typography>

        {/* Subject */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {issue.subject}
        </Typography>

        {/* Tracker + assignee row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={issue.trackerName ?? '-'}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
          {avatarLetter && (
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: 12,
                bgcolor: 'primary.main',
              }}
            >
              {avatarLetter}
            </Avatar>
          )}
        </Box>

        {/* Progress bar */}
        {issue.doneRatio > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={issue.doneRatio}
              sx={{ flex: 1, height: 4, borderRadius: 2 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {issue.doneRatio}%
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
});
