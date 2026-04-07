import { useState, memo } from 'react';
import { Box, Typography, Badge, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Draggable } from '@hello-pangea/dnd';
import type { DroppableProvided } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';
import type { KanbanIssue } from './KanbanCard';

interface KanbanColumnProps {
  statusId: number;
  statusName: string;
  isClosed: boolean;
  issues: KanbanIssue[];
  provided: DroppableProvided;
  onClickIssue?: (issueId: number) => void;
}

export default memo(function KanbanColumn({
  statusName,
  isClosed,
  issues,
  provided,
  onClickIssue,
}: KanbanColumnProps) {
  const [expanded, setExpanded] = useState(!isClosed);

  return (
    <Box
      ref={provided.innerRef}
      {...provided.droppableProps}
      sx={{
        minWidth: !expanded ? 60 : 280,
        width: !expanded ? 60 : 280,
        flexShrink: 0,
        bgcolor: 'grey.100',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        transition: 'width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          p: 1.5,
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {!expanded ? (
          // Collapsed vertical text
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Badge badgeContent={issues.length} color="default" sx={{ mb: 1 }}>
              <Box />
            </Badge>
            <Typography
              variant="caption"
              sx={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {statusName}
            </Typography>
            <IconButton size="small" sx={{ mt: 1 }} onClick={(e) => { e.stopPropagation(); setExpanded(true); }}>
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {statusName}
              </Typography>
              <Badge
                badgeContent={issues.length}
                color={isClosed ? 'default' : 'primary'}
                sx={{
                  '& .MuiBadge-badge': {
                    position: 'static',
                    transform: 'none',
                  },
                }}
              />
            </Box>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded(false); }}>
              <ExpandLessIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      {/* Column body */}
      <Collapse in={expanded} timeout={200}>
        <Box
          sx={{
            p: 1,
            overflowY: 'auto',
            flex: 1,
            minHeight: 60,
          }}
        >
          {issues.map((issue, index) => (
            <Draggable
              draggableId={`issue-${issue.id}`}
              index={index}
              key={issue.id}
            >
              {(dragProvided) => (
                <KanbanCard issue={issue} provided={dragProvided} onClickIssue={onClickIssue} />
              )}
            </Draggable>
          ))}
          {provided.placeholder}

          {issues.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                color: 'text.disabled',
              }}
            >
              <Typography variant="caption">
                이슈 없음
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
});
