import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent,
  Paper, Skeleton, Alert, Button, useTheme, useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import axiosInstance from '../../../api/axiosInstance';

// --- Types matching backend GroupDashboardDto ---
interface MemberStatsDto {
  userId: number;
  userName: string;
  closedIssueCount: number;
  openIssueCount: number;
  totalHours: number;
}

interface MonthlyTrendDto {
  month: string;
  closedCount: number;
  createdCount: number;
}

interface TrackerDistributionDto {
  trackerName: string;
  count: number;
}

interface GroupSummaryDto {
  totalMembers: number;
  totalClosedIssues: number;
  totalOpenIssues: number;
  totalHours: number;
}

interface GroupDashboardData {
  groupId: number;
  groupName: string;
  memberStats: MemberStatsDto[];
  monthlyTrend: MonthlyTrendDto[];
  trackerDistribution: TrackerDistributionDto[];
  summary: GroupSummaryDto;
}

const TRACKER_COLORS = [
  '#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f',
  '#00bcd4', '#ff5722', '#795548', '#607d8b', '#e91e63',
];

function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[...Array(4)].map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 3 }}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {[...Array(4)].map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultTo = dayjs();
  const defaultFrom = dayjs().subtract(3, 'month');

  const [fromDate, setFromDate] = useState<Dayjs | null>(defaultFrom);
  const [toDate, setToDate] = useState<Dayjs | null>(defaultTo);

  const fromParam = fromDate ? fromDate.format('YYYY-MM-DD') : undefined;
  const toParam = toDate ? toDate.format('YYYY-MM-DD') : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['group-dashboard', id, fromParam, toParam],
    queryFn: () =>
      axiosInstance
        .get<GroupDashboardData>(`/admin/groups/${id}/dashboard`, {
          params: { from: fromParam, to: toParam },
        })
        .then((res) => res.data),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  const summaryCards = useMemo(() => {
    if (!data?.summary) return [];
    return [
      {
        label: '총 멤버',
        value: data.summary.totalMembers,
        icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
        suffix: '명',
      },
      {
        label: '완료 이슈',
        value: data.summary.totalClosedIssues,
        icon: <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
        suffix: '건',
      },
      {
        label: '진행 중 이슈',
        value: data.summary.totalOpenIssues,
        icon: <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
        suffix: '건',
      },
      {
        label: '총 작업시간',
        value: data.summary.totalHours,
        icon: <AccessTimeIcon sx={{ fontSize: 40, color: 'info.main' }} />,
        suffix: 'h',
      },
    ];
  }, [data?.summary]);

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              재시도
            </Button>
          }
        >
          대시보드 데이터를 불러오는 데 실패했습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/groups')}
          size="small"
        >
          그룹 목록
        </Button>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {isLoading ? (
            <Skeleton width={200} />
          ) : (
            `${data?.groupName ?? ''} 대시보드`
          )}
        </Typography>
      </Box>

      {/* Date filter */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <DatePicker
              label="시작일"
              value={fromDate}
              onChange={(v: Dayjs | null) => setFromDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <DatePicker
              label="종료일"
              value={toDate}
              onChange={(v: Dayjs | null) => setToDate(v)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setFromDate(dayjs().subtract(3, 'month'));
                setToDate(dayjs());
              }}
            >
              최근 3개월
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <DashboardSkeleton />
      ) : !data ? (
        <Alert severity="info">데이터가 없습니다.</Alert>
      ) : (
        <>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {summaryCards.map((card) => (
              <Grid key={card.label} size={{ xs: 6, sm: 3 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {!isMobile && card.icon}
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}
                      >
                        {typeof card.value === 'number'
                          ? Number.isInteger(card.value)
                            ? card.value
                            : card.value.toFixed(1)
                          : card.value}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          {card.suffix}
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={2}>
            {/* Chart 1: Member issue count (stacked bar) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    그룹원별 이슈 처리량
                  </Typography>
                  {data.memberStats.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={data.memberStats}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="userName"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 60 : 30}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="closedIssueCount"
                          name="완료"
                          stackId="issues"
                          fill="#2e7d32"
                        />
                        <Bar
                          dataKey="openIssueCount"
                          name="진행 중"
                          stackId="issues"
                          fill="#ed6c02"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Chart 2: Monthly trend (line chart) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    월별 완료 추이
                  </Typography>
                  {data.monthlyTrend.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={data.monthlyTrend}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="closedCount"
                          name="완료"
                          stroke="#2e7d32"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="createdCount"
                          name="생성"
                          stroke="#1976d2"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Chart 3: Tracker distribution (donut pie chart) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    트래커별 분포
                  </Typography>
                  {data.trackerDistribution.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={data.trackerDistribution}
                          dataKey="count"
                          nameKey="trackerName"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          label={({ name, value }: { name?: string; value?: number }) =>
                            `${name ?? ''} (${value ?? 0})`
                          }
                        >
                          {data.trackerDistribution.map((entry, index) => (
                            <Cell
                              key={entry.trackerName}
                              fill={TRACKER_COLORS[index % TRACKER_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Chart 4: Member work hours (bar chart) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    그룹원별 작업시간
                  </Typography>
                  {data.memberStats.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={data.memberStats}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="userName"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 60 : 30}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="totalHours"
                          name="작업시간 (h)"
                          fill="#1976d2"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
