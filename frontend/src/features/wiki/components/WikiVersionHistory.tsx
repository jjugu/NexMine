import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Skeleton, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Card, CardContent, CardActionArea, useMediaQuery, useTheme, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../../api/axiosInstance';
import SafeHtml from '../../../components/common/SafeHtml';
import dayjs from 'dayjs';

interface VersionItem {
  version: number;
  title: string;
  editedByName: string;
  comments: string;
  createdAt: string;
}

interface VersionDetail {
  version: number;
  title: string;
  contentHtml: string;
  editedByName: string;
  comments: string;
  createdAt: string;
}

export default function WikiVersionHistory() {
  const { identifier, slug } = useParams<{ identifier: string; slug: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const versionsQuery = useQuery({
    queryKey: ['wiki-versions', identifier, slug],
    queryFn: () =>
      axiosInstance
        .get<VersionItem[]>(`/projects/${identifier}/wiki/${slug}/versions`)
        .then((r) => r.data),
    enabled: !!identifier && !!slug,
  });

  const versionDetailQuery = useQuery({
    queryKey: ['wiki-version-detail', identifier, slug, selectedVersion],
    queryFn: () =>
      axiosInstance
        .get<VersionDetail>(`/projects/${identifier}/wiki/${slug}/versions/${selectedVersion}`)
        .then((r) => r.data),
    enabled: !!identifier && !!slug && selectedVersion !== null,
  });

  function handleViewVersion(version: number) {
    setSelectedVersion(version);
    setViewOpen(true);
  }

  const versions = versionsQuery.data ?? [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(`/projects/${identifier}/wiki/${slug}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">버전 히스토리</Typography>
        <Chip label={slug} size="small" variant="outlined" />
      </Box>

      {versionsQuery.isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {versionsQuery.isError && (
        <Alert severity="error">버전 히스토리를 불러오는데 실패했습니다.</Alert>
      )}

      {/* Desktop: table */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length > 0 && !isMobile && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>버전</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>수정자</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>날짜</TableCell>
                <TableCell align="center">보기</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.version} hover>
                  <TableCell>
                    <Chip label={`v${v.version}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{v.title}</TableCell>
                  <TableCell>{v.editedByName}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }} noWrap>
                      {v.comments || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(v.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleViewVersion(v.version)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mobile: card view */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length > 0 && isMobile && (
        <Grid container spacing={1}>
          {versions.map((v) => (
            <Grid key={v.version} size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardActionArea onClick={() => handleViewVersion(v.version)}>
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Chip label={`v${v.version}`} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(v.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {v.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {v.editedByName} {v.comments ? `- ${v.comments}` : ''}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty state */}
      {!versionsQuery.isLoading && !versionsQuery.isError && versions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">버전 히스토리가 없습니다.</Typography>
        </Box>
      )}

      {/* Version detail dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {versionDetailQuery.data?.title ?? '버전 보기'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              버전 {selectedVersion} - {versionDetailQuery.data?.editedByName ?? ''} -{' '}
              {versionDetailQuery.data?.createdAt
                ? dayjs(versionDetailQuery.data.createdAt).format('YYYY-MM-DD HH:mm')
                : ''}
            </Typography>
          </Box>
          <IconButton onClick={() => setViewOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {versionDetailQuery.isLoading && (
            <Skeleton variant="rectangular" height={200} />
          )}
          {versionDetailQuery.isError && (
            <Alert severity="error">버전 내용을 불러오는데 실패했습니다.</Alert>
          )}
          {versionDetailQuery.data && (
            <SafeHtml html={versionDetailQuery.data.contentHtml || ''} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
