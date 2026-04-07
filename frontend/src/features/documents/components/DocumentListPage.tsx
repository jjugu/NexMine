import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Skeleton,
  Card, CardContent, CardActionArea, useMediaQuery, useTheme, Grid,
  FormControl, InputLabel, Select, MenuItem, Breadcrumbs, Link, Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import axiosInstance from '../../../api/axiosInstance';
import DocumentCreateDialog from './DocumentCreateDialog';
import dayjs from 'dayjs';

interface DocumentItem {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  authorName: string;
  createdAt: string;
}

export default function DocumentListPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [createOpen, setCreateOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const documentsQuery = useQuery({
    queryKey: ['documents', identifier],
    queryFn: () =>
      axiosInstance.get<DocumentItem[]>(`/projects/${identifier}/documents`).then((r) => r.data),
    enabled: !!identifier,
  });

  const documents = documentsQuery.data ?? [];

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const doc of documents) {
      if (doc.categoryName) cats.add(doc.categoryName);
    }
    return Array.from(cats).sort();
  }, [documents]);

  // Filtered documents
  const filtered = useMemo(() => {
    if (!categoryFilter) return documents;
    return documents.filter((d) => d.categoryName === categoryFilter);
  }, [documents, categoryFilter]);

  function handleCreated() {
    setCreateOpen(false);
    documentsQuery.refetch();
  }

  function handleRowClick(id: number) {
    navigate(`/projects/${identifier}/documents/${id}`);
  }

  return (
    <Box>
      {/* Breadcrumb + header */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate(`/projects/${identifier}`)}
          >
            {identifier}
          </Link>
          <Typography color="text.primary">문서</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5">문서</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {categories.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={categoryFilter}
                  label="카테고리"
                  onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">전체</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              새 문서
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Loading */}
      {documentsQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {/* Error */}
      {documentsQuery.isError && (
        <Alert severity="error">문서 목록을 불러오는데 실패했습니다.</Alert>
      )}

      {/* Empty state */}
      {!documentsQuery.isLoading && !documentsQuery.isError && filtered.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            문서가 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            첫 문서를 등록해보세요
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            새 문서 만들기
          </Button>
        </Box>
      )}

      {/* Desktop: table */}
      {!documentsQuery.isLoading && !documentsQuery.isError && filtered.length > 0 && !isMobile && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>제목</TableCell>
                <TableCell sx={{ minWidth: 100 }}>카테고리</TableCell>
                <TableCell sx={{ minWidth: 100 }}>작성자</TableCell>
                <TableCell sx={{ minWidth: 120 }}>등록일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow
                  key={doc.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(doc.id)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {doc.title}
                    </Typography>
                    {doc.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 400 }}>
                        {doc.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.categoryName ? (
                      <Chip label={doc.categoryName} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {doc.authorName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(doc.createdAt).format('YYYY-MM-DD')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mobile: card view */}
      {!documentsQuery.isLoading && !documentsQuery.isError && filtered.length > 0 && isMobile && (
        <Grid container spacing={1.5}>
          {filtered.map((doc) => (
            <Grid key={doc.id} size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardActionArea onClick={() => handleRowClick(doc.id)}>
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, mr: 1 }}>
                        {doc.title}
                      </Typography>
                      {doc.categoryName && (
                        <Chip label={doc.categoryName} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                      )}
                    </Box>
                    {doc.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
                        {doc.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {doc.authorName} &middot; {dayjs(doc.createdAt).format('YYYY-MM-DD')}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create dialog */}
      {identifier && (
        <DocumentCreateDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
          projectIdentifier={identifier}
        />
      )}
    </Box>
  );
}
