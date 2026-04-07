import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, TablePagination, Card, CardContent,
  CardActionArea, useMediaQuery, useTheme, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { QueryState, TableSkeleton, CardSkeleton } from '../../../components/common/QueryState';
import axiosInstance from '../../../api/axiosInstance';
import type { ProjectDtoPagedResult } from '../../../api/generated/model';
import ProjectCreateDialog from './ProjectCreateDialog';

function fetchProjects(page: number, pageSize: number, search: string) {
  return axiosInstance
    .get<ProjectDtoPagedResult>('/Projects', {
      params: { page, pageSize, search: search || undefined },
    })
    .then((res) => res.data);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ProjectListPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);
  const searchFromUrl = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchInput) {
        newParams.set('search', searchInput);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1');
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', { page, pageSize, search: searchFromUrl }],
    queryFn: () => fetchProjects(page, pageSize, searchFromUrl),
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(newPage + 1));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('pageSize', event.target.value);
      newParams.set('page', '1');
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  function handleRowClick(identifier: string | null | undefined) {
    if (identifier) {
      navigate(`/projects/${identifier}`);
    }
  }

  function handleCreateOpen() {
    setIsCreateOpen(true);
  }

  function handleCreateClose() {
    setIsCreateOpen(false);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">프로젝트</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>
          새 프로젝트
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="프로젝트 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ maxWidth: { sm: 400 } }}
        />
      </Box>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        onRetry={() => refetch()}
        errorMessage="프로젝트 목록을 불러오는데 실패했습니다."
        skeleton={isMobile ? <CardSkeleton count={4} /> : <TableSkeleton rows={5} columns={4} />}
        emptyState={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              프로젝트가 없습니다
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              첫 프로젝트를 만들어보세요
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>
              새 프로젝트 만들기
            </Button>
          </Box>
        }
      >
      {/* Desktop: table view */}
      {!isMobile && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>식별자</TableCell>
                <TableCell>공개여부</TableCell>
                <TableCell>생성일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((project) => (
                <TableRow
                  key={project.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(project.identifier)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {project.identifier}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {project.isPublic ? (
                      <Chip icon={<PublicIcon />} label="공개" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip icon={<LockIcon />} label="비공개" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(project.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당 항목"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* Mobile: card view */}
      {isMobile && (
        <>
          <Grid container spacing={1.5}>
            {items.map((project) => (
              <Grid key={project.id} size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => handleRowClick(project.identifier)}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {project.name}
                        </Typography>
                        {project.isPublic ? (
                          <Chip icon={<PublicIcon />} label="공개" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip icon={<LockIcon />} label="비공개" size="small" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {project.identifier} &middot; {formatDate(project.createdAt)}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      )}
      </QueryState>

      {/* Create Dialog */}
      <ProjectCreateDialog open={isCreateOpen} onClose={handleCreateClose} />
    </Box>
  );
}
