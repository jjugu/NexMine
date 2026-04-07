import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, useMediaQuery, useTheme, CardActionArea,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import axiosInstance from '../../../api/axiosInstance';
import { QueryState, DashboardSkeleton } from '../../../components/common/QueryState';

// --- Types for dashboard API response ---
interface DashboardIssue {
  id: number;
  subject: string;
  projectName: string;
  projectIdentifier: string;
  statusName: string;
  priorityName: string;
  assignedToName?: string | null;
  dueDate?: string | null;
  doneRatio: number;
  updatedAt: string;
}

interface StatusCount {
  statusName: string;
  count: number;
  isClosed: boolean;
}

interface PriorityCount {
  priorityName: string;
  count: number;
}

interface DashboardData {
  myIssues: DashboardIssue[];
  overdueIssues: DashboardIssue[];
  issuesByStatus: StatusCount[];
  issuesByPriority: PriorityCount[];
  totalIssueCount: number;
}

// --- Chart color maps ---
const STATUS_COLORS: Record<string, string> = {
  New: '#1976d2',
  '신규': '#1976d2',
  InProgress: '#ed6c02',
  '진행중': '#ed6c02',
  Resolved: '#2e7d32',
  '해결': '#2e7d32',
  Feedback: '#9c27b0',
  '피드백': '#9c27b0',
  Closed: '#9e9e9e',
  '닫힘': '#9e9e9e',
  '완료': '#9e9e9e',
};

const PRIORITY_COLORS: Record<string, string> = {
  Immediate: '#d32f2f',
  '긴급': '#d32f2f',
  Urgent: '#ed6c02',
  '매우높음': '#ed6c02',
  High: '#ffa000',
  '높음': '#ffa000',
  Normal: '#1976d2',
  '보통': '#1976d2',
  Low: '#9e9e9e',
  '낮음': '#9e9e9e',
};

const DEFAULT_STATUS_COLORS = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#9e9e9e', '#00bcd4', '#ff5722'];
const DEFAULT_PRIORITY_COLORS = ['#d32f2f', '#ed6c02', '#ffa000', '#1976d2', '#9e9e9e'];

function getStatusColor(name: string, index: number): string {
  return STATUS_COLORS[name] ?? DEFAULT_STATUS_COLORS[index % DEFAULT_STATUS_COLORS.length];
}

function getPriorityBarColor(name: string, index: number): string {
  return PRIORITY_COLORS[name] ?? DEFAULT_PRIORITY_COLORS[index % DEFAULT_PRIORITY_COLORS.length];
}

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

function getPriorityChipColor(name?: string): 'error' | 'warning' | 'info' | 'default' {
  if (!name) return 'default';
  const n = name.toLowerCase();
  if (n === 'immediate' || n === '긴급' || n === 'urgent' || n === '매우높음') return 'error';
  if (n === 'high' || n === '높음') return 'warning';
  if (n === 'normal' || n === '보통') return 'info';
  return 'default';
}

// --- Main component ---
export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      axiosInstance.get<DashboardData>('/dashboard').then((r) => r.data),
    refetchInterval: 60000,
  });

  const totalIssues = data?.totalIssueCount ?? 0;
  const myIssueCount = data?.myIssues?.length ?? 0;
  const overdueCount = data?.overdueIssues?.length ?? 0;
  const closedCount = data?.issuesByStatus
    ?.filter((s) => s.isClosed)
    .reduce((sum, s) => sum + s.count, 0) ?? 0;
  const completionRate = totalIssues > 0 ? Math.round((closedCount / totalIssues) * 100) : 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>대시보드</Typography>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorMessage="대시보드 데이터를 불러오는데 실패했습니다."
        skeleton={<DashboardSkeleton />}
      >
        {/* Row 1: Summary stat cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Total issues */}
          <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BugReportIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalIssues}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">전체 이슈</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* My issues */}
          <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIndIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {myIssueCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">내 이슈</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Overdue */}
          <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningAmberIcon sx={{ fontSize: 40, color: overdueCount > 0 ? 'error.main' : 'text.disabled' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: overdueCount > 0 ? 'error.main' : undefined }}>
                    {overdueCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">기한 초과</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Completion rate */}
          <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {`${completionRate}%`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">완료율</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Row 2: Charts */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Status distribution - Pie Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  상태별 이슈 분포
                </Typography>
                {(!data?.issuesByStatus || data.issuesByStatus.length === 0) ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      데이터가 없습니다
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={data.issuesByStatus}
                        dataKey="count"
                        nameKey="statusName"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }: { name?: string; value?: number }) =>
                          `${name ?? ''} (${value ?? 0})`
                        }
                      >
                        {data.issuesByStatus.map((entry, index) => (
                          <Cell
                            key={entry.statusName}
                            fill={getStatusColor(entry.statusName, index)}
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

          {/* Priority distribution - Bar Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  우선순위별 이슈 분포
                </Typography>
                {(!data?.issuesByPriority || data.issuesByPriority.length === 0) ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      데이터가 없습니다
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.issuesByPriority}>
                      <XAxis dataKey="priorityName" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="이슈 수">
                        {data.issuesByPriority.map((entry, index) => (
                          <Cell
                            key={entry.priorityName}
                            fill={getPriorityBarColor(entry.priorityName, index)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Row 3: Issue lists */}
        <Grid container spacing={2}>
          {/* My issues */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  내 이슈
                </Typography>
                {(!data?.myIssues || data.myIssues.length === 0) ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AssignmentIndIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      배정된 이슈가 없습니다
                    </Typography>
                  </Box>
                ) : isMobile ? (
                  // Mobile: card list
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {data.myIssues.slice(0, 10).map((issue) => (
                      <Card
                        key={issue.id}
                        variant="outlined"
                        sx={{ '&:hover': { borderColor: 'primary.main' } }}
                      >
                        <CardActionArea
                          onClick={() =>
                            navigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)
                          }
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
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  // Desktop: compact table
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>제목</TableCell>
                          <TableCell>프로젝트</TableCell>
                          <TableCell>상태</TableCell>
                          <TableCell>우선순위</TableCell>
                          <TableCell>갱신일</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.myIssues.slice(0, 10).map((issue) => (
                          <TableRow
                            key={issue.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() =>
                              navigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)
                            }
                          >
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
                              <Typography variant="body2" color="text.secondary">
                                {issue.projectName}
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
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(issue.updatedAt)}
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
          </Grid>

          {/* Overdue issues */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: overdueCount > 0 ? 'error.light' : undefined,
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: overdueCount > 0 ? 'error.main' : undefined,
                  }}
                >
                  기한 초과 이슈
                </Typography>
                {(!data?.overdueIssues || data.overdueIssues.length === 0) ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      기한 초과 이슈가 없습니다
                    </Typography>
                  </Box>
                ) : isMobile ? (
                  // Mobile: card list
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {data.overdueIssues.slice(0, 10).map((issue) => (
                      <Card
                        key={issue.id}
                        variant="outlined"
                        sx={{
                          borderColor: 'error.light',
                          '&:hover': { borderColor: 'error.main' },
                        }}
                      >
                        <CardActionArea
                          onClick={() =>
                            navigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)
                          }
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
                              <Typography variant="caption" color="error">
                                {formatDate(issue.dueDate)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  // Desktop: compact table
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>제목</TableCell>
                          <TableCell>프로젝트</TableCell>
                          <TableCell>기한</TableCell>
                          <TableCell>담당자</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.overdueIssues.slice(0, 10).map((issue) => (
                          <TableRow
                            key={issue.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() =>
                              navigate(`/projects/${issue.projectIdentifier}/issues/${issue.id}`)
                            }
                          >
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
                              <Typography variant="body2" color="text.secondary">
                                {issue.projectName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error">
                                {formatDate(issue.dueDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {issue.assignedToName ?? '-'}
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
          </Grid>
        </Grid>
      </QueryState>
    </Box>
  );
}
