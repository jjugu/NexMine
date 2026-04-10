import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Chip, MenuItem, Select, FormControl, ClickAwayListener,
  type SelectChangeEvent,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import { getPriorityColor } from '../utils/issueUtils';

interface Option {
  id: number;
  name: string;
}

interface InlineChipFieldProps {
  issueId: number;
  identifier: string;
  fieldName: string;
  currentId: number | null | undefined;
  currentLabel: string;
  options: Option[];
  chipColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

function InlineChipField({
  issueId,
  identifier,
  fieldName,
  currentId,
  currentLabel,
  options,
  chipColor = 'default',
}: InlineChipFieldProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (value: number) =>
      axiosInstance.put(`/Issues/${issueId}`, { [fieldName]: value }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['journals', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', identifier] });
      queryClient.invalidateQueries({ queryKey: ['allowed-statuses', issueId] });
      setEditing(false);
    },
  });

  function handleChange(e: SelectChangeEvent<number>) {
    const value = Number(e.target.value);
    if (value && value !== currentId) {
      mutation.mutate(value);
    } else {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <Chip
        label={currentLabel}
        size="small"
        color={chipColor}
        variant="outlined"
        onClick={() => setEditing(true)}
        sx={{
          cursor: 'pointer',
          '&:hover': { opacity: 0.7, borderStyle: 'dashed' },
        }}
        title="클릭하여 변경"
      />
    );
  }

  return (
    <ClickAwayListener onClickAway={() => setEditing(false)}>
      <FormControl size="small" sx={{ minWidth: 120 }} ref={selectRef}>
        <Select<number>
          value={currentId ?? 0}
          onChange={handleChange}
          open
          onClose={() => setEditing(false)}
          autoFocus
          size="small"
          disabled={mutation.isPending}
          sx={{ '& .MuiSelect-select': { py: 0.5, fontSize: '0.8125rem' } }}
        >
          {options.map((opt) => (
            <MenuItem key={opt.id} value={opt.id} dense>
              {opt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </ClickAwayListener>
  );
}

// ---------- Status (workflow-aware) ----------

interface InlineStatusChipProps {
  issueId: number;
  identifier: string;
  currentId: number | null | undefined;
  currentLabel: string;
  allowedStatuses: Option[];
}

export function InlineStatusChip({
  issueId,
  identifier,
  currentId,
  currentLabel,
  allowedStatuses,
}: InlineStatusChipProps) {
  return (
    <InlineChipField
      issueId={issueId}
      identifier={identifier}
      fieldName="statusId"
      currentId={currentId}
      currentLabel={currentLabel}
      options={allowedStatuses}
      chipColor="success"
    />
  );
}

// ---------- Priority ----------

interface InlinePriorityChipProps {
  issueId: number;
  identifier: string;
  currentId: number | null | undefined;
  currentLabel: string;
  priorities: Option[];
}

export function InlinePriorityChip({
  issueId,
  identifier,
  currentId,
  currentLabel,
  priorities,
}: InlinePriorityChipProps) {
  return (
    <InlineChipField
      issueId={issueId}
      identifier={identifier}
      fieldName="priorityId"
      currentId={currentId}
      currentLabel={currentLabel}
      options={priorities}
      chipColor={getPriorityColor(currentLabel)}
    />
  );
}

// ---------- Tracker ----------

interface InlineTrackerChipProps {
  issueId: number;
  identifier: string;
  currentId: number | null | undefined;
  currentLabel: string;
  trackers: Option[];
}

export function InlineTrackerChip({
  issueId,
  identifier,
  currentId,
  currentLabel,
  trackers,
}: InlineTrackerChipProps) {
  return (
    <InlineChipField
      issueId={issueId}
      identifier={identifier}
      fieldName="trackerId"
      currentId={currentId}
      currentLabel={currentLabel}
      options={trackers}
    />
  );
}
