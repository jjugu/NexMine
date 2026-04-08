import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, TextField, Card, CardContent,
  CardActionArea, Breadcrumbs, Link, Paper, Divider,
  IconButton, Avatar, Chip, CircularProgress, Alert,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import PushPinIcon from '@mui/icons-material/PushPin';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from '../../../api/axiosInstance';
import type {
  ForumDto,
  ForumTopicDetailDto,
  ForumReplyDto,
  CreateForumRequest,
  CreateTopicRequest,
  CreateReplyRequest,
} from '../../../api/generated/model';
import { useAuthStore } from '../../../stores/authStore';

// ---------- Types ----------

interface ForumTopicListItem {
  id: number;
  forumId: number;
  authorId: number;
  authorName: string;
  subject: string;
  content: string;
  isSticky: boolean;
  isLocked: boolean;
  repliesCount: number;
  lastReplyAt: string | null;
  createdAt: string;
}

// ---------- API helpers ----------

function fetchForums(identifier: string) {
  return axiosInstance
    .get<ForumDto[]>(`/projects/${identifier}/forums`)
    .then((r) => r.data);
}

function fetchTopics(forumId: number) {
  return axiosInstance
    .get<ForumTopicListItem[]>(`/forums/${forumId}/topics`)
    .then((r) => r.data);
}

function fetchTopicDetail(topicId: number) {
  return axiosInstance
    .get<ForumTopicDetailDto>(`/forum-topics/${topicId}`)
    .then((r) => r.data);
}

// ---------- Date formatting ----------

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(s).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------- View type ----------

type ViewState =
  | { type: 'forum-list' }
  | { type: 'topic-list'; forumId: number; forumName: string }
  | { type: 'topic-detail'; forumId: number; forumName: string; topicId: number };

// ---------- ForumPage ----------

function fetchProject(identifier: string) {
  return axiosInstance
    .get<{ id?: number; name?: string | null; identifier?: string | null }>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function ForumPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const [view, setView] = useState<ViewState>({ type: 'forum-list' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ── Forum List ────────────────────────────────────────

  const forumsQuery = useQuery({
    queryKey: ['forums', identifier],
    queryFn: () => fetchForums(identifier!),
    enabled: !!identifier,
  });

  // ── Create Forum Dialog ────────────────────────────────

  const [createForumOpen, setCreateForumOpen] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumDesc, setNewForumDesc] = useState('');

  const createForumMutation = useMutation({
    mutationFn: (data: CreateForumRequest) =>
      axiosInstance.post(`/projects/${identifier}/forums`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forums', identifier] });
      setCreateForumOpen(false);
      setNewForumName('');
      setNewForumDesc('');
      setSnackbar({ open: true, message: '게시판이 생성되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '게시판 생성에 실패했습니다.', severity: 'error' });
    },
  });

  function handleCreateForum() {
    if (!newForumName.trim()) return;
    createForumMutation.mutate({
      name: newForumName.trim(),
      description: newForumDesc.trim() || undefined,
      position: (forumsQuery.data?.length ?? 0) + 1,
    });
  }

  // ── Topic List ─────────────────────────────────────────

  const topicsQuery = useQuery({
    queryKey: ['forum-topics', view.type === 'topic-list' || view.type === 'topic-detail' ? view.forumId : null],
    queryFn: () => {
      if (view.type === 'topic-list' || view.type === 'topic-detail') {
        return fetchTopics(view.forumId);
      }
      return Promise.resolve([]);
    },
    enabled: view.type === 'topic-list' || view.type === 'topic-detail',
  });

  // ── Create Topic Dialog ────────────────────────────────

  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');

  const createTopicMutation = useMutation({
    mutationFn: (data: { forumId: number; body: CreateTopicRequest }) =>
      axiosInstance.post(`/forums/${data.forumId}/topics`, data.body),
    onSuccess: () => {
      const forumId = view.type !== 'forum-list' ? view.forumId : null;
      if (forumId) {
        queryClient.invalidateQueries({ queryKey: ['forum-topics', forumId] });
      }
      queryClient.invalidateQueries({ queryKey: ['forums', identifier] });
      setCreateTopicOpen(false);
      setNewTopicSubject('');
      setNewTopicContent('');
      setSnackbar({ open: true, message: '주제가 생성되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '주제 생성에 실패했습니다.', severity: 'error' });
    },
  });

  function handleCreateTopic() {
    if (view.type === 'forum-list') return;
    if (!newTopicSubject.trim()) return;
    createTopicMutation.mutate({
      forumId: view.forumId,
      body: {
        subject: newTopicSubject.trim(),
        content: newTopicContent.trim(),
      },
    });
  }

  // ── Topic Detail ───────────────────────────────────────

  const topicDetailQuery = useQuery({
    queryKey: ['forum-topic-detail', view.type === 'topic-detail' ? view.topicId : null],
    queryFn: () => {
      if (view.type === 'topic-detail') {
        return fetchTopicDetail(view.topicId);
      }
      return Promise.resolve(null);
    },
    enabled: view.type === 'topic-detail',
  });

  // ── Reply ──────────────────────────────────────────────

  const [replyContent, setReplyContent] = useState('');

  const createReplyMutation = useMutation({
    mutationFn: (data: { topicId: number; body: CreateReplyRequest }) =>
      axiosInstance.post(`/forum-topics/${data.topicId}/replies`, data.body),
    onSuccess: () => {
      if (view.type === 'topic-detail') {
        queryClient.invalidateQueries({ queryKey: ['forum-topic-detail', view.topicId] });
        queryClient.invalidateQueries({ queryKey: ['forum-topics', view.forumId] });
      }
      setReplyContent('');
      setSnackbar({ open: true, message: '답글이 등록되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '답글 등록에 실패했습니다.', severity: 'error' });
    },
  });

  function handleSubmitReply() {
    if (view.type !== 'topic-detail') return;
    if (!replyContent.trim()) return;
    createReplyMutation.mutate({
      topicId: view.topicId,
      body: { content: replyContent.trim() },
    });
  }

  // ── Delete Reply ───────────────────────────────────────

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: number) =>
      axiosInstance.delete(`/forum-replies/${replyId}`),
    onSuccess: () => {
      if (view.type === 'topic-detail') {
        queryClient.invalidateQueries({ queryKey: ['forum-topic-detail', view.topicId] });
        queryClient.invalidateQueries({ queryKey: ['forum-topics', view.forumId] });
      }
      setSnackbar({ open: true, message: '답글이 삭제되었습니다.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: '답글 삭제에 실패했습니다.', severity: 'error' });
    },
  });

  // ── Navigation helpers ─────────────────────────────────

  const goToForumList = useCallback(() => {
    setView({ type: 'forum-list' });
  }, []);

  const goToTopicList = useCallback((forumId: number, forumName: string) => {
    setView({ type: 'topic-list', forumId, forumName });
  }, []);

  const goToTopicDetail = useCallback((topicId: number) => {
    if (view.type === 'topic-list' || view.type === 'topic-detail') {
      setView({ type: 'topic-detail', forumId: view.forumId, forumName: view.forumName, topicId });
    }
  }, [view]);

  // ── Render ─────────────────────────────────────────────

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
          sx={{ cursor: 'pointer' }}
        >
          프로젝트
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
          sx={{ cursor: 'pointer' }}
        >
          {projectQuery.data?.name ?? identifier}
        </Link>
        {view.type === 'forum-list' ? (
          <Typography color="text.primary">게시판</Typography>
        ) : (
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={goToForumList}
            sx={{ cursor: 'pointer' }}
          >
            게시판
          </Link>
        )}
        {(view.type === 'topic-list' || view.type === 'topic-detail') && (
          view.type === 'topic-list' ? (
            <Typography color="text.primary">{view.forumName}</Typography>
          ) : (
            <Link
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => goToTopicList(view.forumId, view.forumName)}
              sx={{ cursor: 'pointer' }}
            >
              {view.forumName}
            </Link>
          )
        )}
        {view.type === 'topic-detail' && topicDetailQuery.data && (
          <Typography color="text.primary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topicDetailQuery.data.subject}
          </Typography>
        )}
      </Breadcrumbs>

      {/* ====== Step 1: Forum List ====== */}
      {view.type === 'forum-list' && (
        <ForumListView
          forums={forumsQuery.data ?? []}
          isLoading={forumsQuery.isLoading}
          isError={forumsQuery.isError}
          isAdmin={!!user?.isAdmin}
          onSelectForum={(f) => goToTopicList(f.id!, f.name ?? '게시판')}
          onCreateForum={() => setCreateForumOpen(true)}
          onRetry={() => forumsQuery.refetch()}
        />
      )}

      {/* ====== Step 2: Topic List ====== */}
      {view.type === 'topic-list' && (
        <TopicListView
          forumName={view.forumName}
          topics={topicsQuery.data ?? []}
          isLoading={topicsQuery.isLoading}
          isError={topicsQuery.isError}
          onBack={goToForumList}
          onSelectTopic={(t) => goToTopicDetail(t.id)}
          onCreateTopic={() => setCreateTopicOpen(true)}
          onRetry={() => topicsQuery.refetch()}
        />
      )}

      {/* ====== Step 3: Topic Detail ====== */}
      {view.type === 'topic-detail' && (
        <TopicDetailView
          topic={topicDetailQuery.data}
          isLoading={topicDetailQuery.isLoading}
          isError={topicDetailQuery.isError}
          replyContent={replyContent}
          onReplyContentChange={setReplyContent}
          onSubmitReply={handleSubmitReply}
          isSubmittingReply={createReplyMutation.isPending}
          onBack={() => goToTopicList(view.forumId, view.forumName)}
          onDeleteReply={(id) => deleteReplyMutation.mutate(id)}
          isDeletingReply={deleteReplyMutation.isPending}
          currentUserId={user?.id}
          onRetry={() => topicDetailQuery.refetch()}
        />
      )}

      {/* ====== Create Forum Dialog ====== */}
      <Dialog open={createForumOpen} onClose={() => setCreateForumOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>새 게시판</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="게시판 이름"
              required
              fullWidth
              value={newForumName}
              onChange={(e) => setNewForumName(e.target.value)}
              autoFocus
            />
            <TextField
              label="설명"
              fullWidth
              multiline
              rows={2}
              value={newForumDesc}
              onChange={(e) => setNewForumDesc(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateForumOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!newForumName.trim() || createForumMutation.isPending}
            onClick={handleCreateForum}
          >
            {createForumMutation.isPending ? '생성 중...' : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== Create Topic Dialog ====== */}
      <Dialog open={createTopicOpen} onClose={() => setCreateTopicOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>새 주제</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="제목"
              required
              fullWidth
              value={newTopicSubject}
              onChange={(e) => setNewTopicSubject(e.target.value)}
              autoFocus
            />
            <TextField
              label="내용"
              fullWidth
              multiline
              rows={5}
              value={newTopicContent}
              onChange={(e) => setNewTopicContent(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTopicOpen(false)}>취소</Button>
          <Button
            variant="contained"
            disabled={!newTopicSubject.trim() || createTopicMutation.isPending}
            onClick={handleCreateTopic}
          >
            {createTopicMutation.isPending ? '생성 중...' : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== Snackbar ====== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ---------- Sub-components ----------

interface ForumListViewProps {
  forums: ForumDto[];
  isLoading: boolean;
  isError: boolean;
  isAdmin: boolean;
  onSelectForum: (f: ForumDto) => void;
  onCreateForum: () => void;
  onRetry: () => void;
}

function ForumListView({ forums, isLoading, isError, isAdmin, onSelectForum, onCreateForum, onRetry }: ForumListViewProps) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">게시판</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateForum}>
            새 게시판
          </Button>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} />
          ))}
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={onRetry}>재시도</Button>}>
          게시판 목록을 불러오는데 실패했습니다.
        </Alert>
      )}

      {!isLoading && !isError && forums.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <ForumIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            게시판이 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            첫 게시판을 만들어보세요
          </Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateForum}>
              새 게시판
            </Button>
          )}
        </Box>
      )}

      {!isLoading && !isError && forums.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {forums.map((forum) => (
            <Card key={forum.id} variant="outlined">
              <CardActionArea onClick={() => onSelectForum(forum)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ForumIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {forum.name}
                    </Typography>
                  </Box>
                  {forum.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {forum.description}
                    </Typography>
                  )}
                  <Chip
                    label={`${forum.topicsCount ?? 0}개 주제`}
                    size="small"
                    variant="outlined"
                    icon={<ChatBubbleOutlineIcon />}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </>
  );
}

// ── Topic List View ──────────────────────────────────────

interface TopicListViewProps {
  forumName: string;
  topics: ForumTopicListItem[];
  isLoading: boolean;
  isError: boolean;
  onBack: () => void;
  onSelectTopic: (t: ForumTopicListItem) => void;
  onCreateTopic: () => void;
  onRetry: () => void;
}

function TopicListView({ forumName, topics, isLoading, isError, onBack, onSelectTopic, onCreateTopic, onRetry }: TopicListViewProps) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">{forumName}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateTopic}>
          새 주제
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={onRetry}>재시도</Button>}>
          주제 목록을 불러오는데 실패했습니다.
        </Alert>
      )}

      {!isLoading && !isError && topics.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            주제가 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            첫 주제를 작성해보세요
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateTopic}>
            새 주제
          </Button>
        </Box>
      )}

      {!isLoading && !isError && topics.length > 0 && (
        <Paper variant="outlined">
          {topics.map((topic, idx) => (
            <Box key={topic.id}>
              {idx > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => onSelectTopic(topic)}
              >
                {/* Icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  {topic.isSticky && <PushPinIcon fontSize="small" color="primary" titleAccess="고정 주제" />}
                  {topic.isLocked && <LockIcon fontSize="small" color="warning" titleAccess="잠긴 주제" />}
                  {!topic.isSticky && !topic.isLocked && <ChatBubbleOutlineIcon fontSize="small" color="action" />}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: topic.isSticky ? 700 : 500 }} noWrap>
                    {topic.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <PersonIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
                    {topic.authorName} &middot; {formatDateTime(topic.createdAt)}
                  </Typography>
                </Box>

                {/* Replies count */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  <ChatBubbleOutlineIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {topic.repliesCount}
                  </Typography>
                </Box>

                {/* Last reply */}
                <Box sx={{ minWidth: 120, textAlign: 'right', display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    {topic.lastReplyAt ? formatDateTime(topic.lastReplyAt) : '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </>
  );
}

// ── Topic Detail View ────────────────────────────────────

interface TopicDetailViewProps {
  topic: ForumTopicDetailDto | null | undefined;
  isLoading: boolean;
  isError: boolean;
  replyContent: string;
  onReplyContentChange: (val: string) => void;
  onSubmitReply: () => void;
  isSubmittingReply: boolean;
  onBack: () => void;
  onDeleteReply: (id: number) => void;
  isDeletingReply: boolean;
  currentUserId?: number;
  onRetry: () => void;
}

function TopicDetailView({
  topic, isLoading, isError,
  replyContent, onReplyContentChange, onSubmitReply, isSubmittingReply,
  onBack, onDeleteReply, isDeletingReply, currentUserId, onRetry,
}: TopicDetailViewProps) {
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }

  if (isError || !topic) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={onRetry}>재시도</Button>}>
        주제를 불러오는데 실패했습니다.
      </Alert>
    );
  }

  const replies: ForumReplyDto[] = topic.replies ?? [];

  return (
    <>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {topic.isSticky && <Chip label="고정" icon={<PushPinIcon />} size="small" color="primary" variant="outlined" />}
          {topic.isLocked && <Chip label="잠금" icon={<LockIcon />} size="small" color="warning" variant="outlined" />}
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {topic.subject}
          </Typography>
        </Box>
      </Box>

      {/* Original post */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
            {(topic.authorName ?? '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{topic.authorName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(topic.createdAt)}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {topic.content}
        </Typography>
      </Paper>

      {/* Replies */}
      {replies.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            답글 ({replies.length})
          </Typography>
          {replies.map((reply, idx) => (
            <Paper key={reply.id} variant="outlined" sx={{ p: 2, mb: idx < replies.length - 1 ? 1.5 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 12 }}>
                  {(reply.authorName ?? '?')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{reply.authorName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(reply.createdAt)}
                  </Typography>
                </Box>
                {reply.authorId === currentUserId && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => { if (reply.id != null) onDeleteReply(reply.id); }}
                    disabled={isDeletingReply}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {reply.content}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Reply form */}
      {topic.isLocked ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          잠긴 주제입니다. 답글을 작성할 수 없습니다.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>답글 작성</Typography>
          <TextField
            placeholder="답글 내용을 입력하세요..."
            fullWidth
            multiline
            rows={3}
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              disabled={!replyContent.trim() || isSubmittingReply}
              onClick={onSubmitReply}
              startIcon={isSubmittingReply ? <CircularProgress size={16} /> : undefined}
            >
              {isSubmittingReply ? '등록 중...' : '답글'}
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
}
