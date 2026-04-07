import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, TextField, InputAdornment,
  Paper, Skeleton, Tab, Tabs, TablePagination,
  List, ListItemButton, ListItemIcon, ListItemText,
  Alert, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BugReportIcon from '@mui/icons-material/BugReport';
import ArticleIcon from '@mui/icons-material/Article';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import axiosInstance from '../../../api/axiosInstance';

interface SearchResultItem {
  type: string;
  id: number;
  title: string;
  projectIdentifier: string;
  projectName: string;
  snippet: string;
  updatedAt: string;
}

interface SearchResponse {
  items: SearchResultItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'issues', label: '이슈' },
  { value: 'wiki', label: '위키' },
];

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Box key={i} component="mark" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', px: 0.25, borderRadius: 0.5 }}>
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'issue':
      return <BugReportIcon color="primary" />;
    case 'wiki':
      return <ArticleIcon color="secondary" />;
    default:
      return <SearchIcon />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'issue':
      return '이슈';
    case 'wiki':
      return '위키';
    default:
      return type;
  }
}

function getResultLink(item: SearchResultItem) {
  switch (item.type) {
    case 'issue':
      return `/projects/${item.projectIdentifier}/issues/${item.id}`;
    case 'wiki':
      return `/projects/${item.projectIdentifier}/wiki/${item.id}`;
    default:
      return '#';
  }
}

export default function SearchResultsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = searchParams.get('q') ?? '';
  const scope = searchParams.get('scope') ?? 'all';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  const [searchInput, setSearchInput] = useState(query);

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== query) {
        const newParams = new URLSearchParams(searchParams);
        if (searchInput) {
          newParams.set('q', searchInput);
        } else {
          newParams.delete('q');
        }
        newParams.set('page', '1');
        setSearchParams(newParams, { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', { q: query, scope, page, pageSize }],
    queryFn: () =>
      axiosInstance
        .get<SearchResponse>('/search', {
          params: { q: query, scope, page, pageSize },
        })
        .then((res) => res.data),
    enabled: !!query,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleScopeChange = (_: React.SyntheticEvent, newScope: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('scope', newScope);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput) {
      newParams.set('q', searchInput);
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <Skeleton variant="text" sx={{ width: '60%' }} />
          <Skeleton variant="text" sx={{ width: '100%' }} />
          <Skeleton variant="text" sx={{ width: '30%' }} />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>검색</Typography>

      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
        <TextField
          inputRef={searchInputRef}
          placeholder="검색어를 입력하세요... (Ctrl+K)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Tabs
        value={scope}
        onChange={handleScopeChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant={isMobile ? 'fullWidth' : 'standard'}
      >
        {SCOPE_OPTIONS.map((opt) => (
          <Tab key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </Tabs>

      {!query ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">검색어를 입력하세요.</Typography>
        </Paper>
      ) : isError ? (
        <Alert severity="error">검색 중 오류가 발생했습니다.</Alert>
      ) : isLoading ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">검색 결과가 없습니다.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            다른 검색어를 시도해 보세요.
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            총 {totalCount}건의 검색 결과
          </Typography>
          <List disablePadding>
            {items.map((item) => (
              <ListItemButton
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(getResultLink(item))}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  border: 1,
                  borderColor: 'divider',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                }}
              >
                {!isMobile && (
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getTypeIcon(item.type)}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {isMobile && getTypeIcon(item.type)}
                      <Typography variant="subtitle2" component="span">
                        <HighlightedText text={item.title} query={query} />
                      </Typography>
                      <Chip label={getTypeLabel(item.type)} size="small" variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      {item.snippet && (
                        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                          <HighlightedText text={item.snippet} query={query} />
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled" component="span" sx={{ display: 'block', mt: 0.5 }}>
                        {item.projectName} &middot; {formatDate(item.updatedAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          <TablePagination
            component="div"
            count={totalCount}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="페이지당 결과 수"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `${to} 이상`}`}
          />
        </>
      )}
    </Box>
  );
}
