import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Checkbox, FormControl, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, CircularProgress,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';

interface MyPageWidget {
  id: number;
  widgetType: string;
  position: number;
  column: number;
}

interface WidgetConfig {
  widgetType: string;
  label: string;
  enabled: boolean;
  column: number;
}

const AVAILABLE_WIDGETS: { widgetType: string; label: string }[] = [
  { widgetType: 'my_issues', label: '내게 할당된 이슈' },
  { widgetType: 'watched_issues', label: '감시 중인 이슈' },
  { widgetType: 'overdue_issues', label: '기한 초과 이슈' },
  { widgetType: 'recent_activity', label: '최근 활동' },
  { widgetType: 'time_entries', label: '시간 기록 요약' },
  { widgetType: 'calendar', label: '이번 달 일정' },
];

function buildInitialConfig(currentWidgets: MyPageWidget[]): WidgetConfig[] {
  return AVAILABLE_WIDGETS.map((aw) => {
    const existing = currentWidgets.find((w) => w.widgetType === aw.widgetType);
    return {
      widgetType: aw.widgetType,
      label: aw.label,
      enabled: !!existing,
      column: existing?.column ?? 0,
    };
  });
}

interface WidgetManagerDialogProps {
  open: boolean;
  onClose: () => void;
  currentWidgets: MyPageWidget[];
}

export default function WidgetManagerDialog({ open, onClose, currentWidgets }: WidgetManagerDialogProps) {
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    if (open) {
      setConfigs(buildInitialConfig(currentWidgets));
    }
  }, [open, currentWidgets]);

  const saveMutation = useMutation({
    mutationFn: (widgets: { widgetType: string; position: number; column: number }[]) =>
      axiosInstance.put('/my/page', { widgets }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-page'] });
      onClose();
    },
  });

  function handleToggle(widgetType: string) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.widgetType === widgetType ? { ...c, enabled: !c.enabled } : c,
      ),
    );
  }

  function handleColumnChange(widgetType: string, column: number) {
    setConfigs((prev) =>
      prev.map((c) =>
        c.widgetType === widgetType ? { ...c, column } : c,
      ),
    );
  }

  function handleSave() {
    const enabledConfigs = configs.filter((c) => c.enabled);
    // Assign positions: group by column, preserve order within each column
    const leftWidgets = enabledConfigs.filter((c) => c.column === 0);
    const rightWidgets = enabledConfigs.filter((c) => c.column === 1);

    const widgets = [
      ...leftWidgets.map((c, i) => ({ widgetType: c.widgetType, position: i, column: 0 })),
      ...rightWidgets.map((c, i) => ({ widgetType: c.widgetType, position: i, column: 1 })),
    ];

    saveMutation.mutate(widgets);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>위젯 관리</DialogTitle>
      <DialogContent>
        {saveMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            위젯 설정 저장에 실패했습니다.
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>표시</TableCell>
                <TableCell>위젯</TableCell>
                <TableCell>컬럼</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.widgetType}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={config.enabled}
                      onChange={() => handleToggle(config.widgetType)}
                    />
                  </TableCell>
                  <TableCell>{config.label}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 80 }} disabled={!config.enabled}>
                      <Select
                        value={config.column}
                        onChange={(e) => handleColumnChange(config.widgetType, e.target.value as number)}
                      >
                        <MenuItem value={0}>좌</MenuItem>
                        <MenuItem value={1}>우</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saveMutation.isPending}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          startIcon={saveMutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
