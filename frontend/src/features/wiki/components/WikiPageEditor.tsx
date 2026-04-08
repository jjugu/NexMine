import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, TextField, Button, Paper, Breadcrumbs, Link,
  FormControl, InputLabel, Select, MenuItem, Divider, IconButton,
  Tooltip, Skeleton, Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import axiosInstance from '../../../api/axiosInstance';

interface WikiPage {
  id: number;
  title: string;
  slug: string;
  contentHtml: string;
  parentPageId: number | null;
  authorName: string;
  version: number;
  updatedAt: string;
}

interface WikiListItem {
  id: number;
  title: string;
  slug: string;
  parentPageId: number | null;
}

function HeadingSelect({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const currentLevel = [1, 2, 3].find((level) =>
    editor.isActive('heading', { level })
  );
  const value = currentLevel ? String(currentLevel) : '0';

  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <Select
        value={value}
        onChange={(e: SelectChangeEvent) => {
          const level = Number(e.target.value);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
          }
        }}
        sx={{ height: 32, fontSize: '0.8rem' }}
      >
        <MenuItem value="0">본문</MenuItem>
        <MenuItem value="1">제목 1</MenuItem>
        <MenuItem value="2">제목 2</MenuItem>
        <MenuItem value="3">제목 3</MenuItem>
      </Select>
    </FormControl>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, isActive, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip title={label}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            borderRadius: 1,
            bgcolor: isActive ? 'action.selected' : 'transparent',
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

function fetchProject(identifier: string) {
  return axiosInstance
    .get<{ id?: number; name?: string | null; identifier?: string | null }>(`/Projects/${identifier}`)
    .then((res) => res.data);
}

export default function WikiPageEditor() {
  const { identifier, slug } = useParams<{ identifier: string; slug?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);

  const projectQuery = useQuery({
    queryKey: ['project', identifier],
    queryFn: () => fetchProject(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });

  const [title, setTitle] = useState('');
  const [parentPageId, setParentPageId] = useState<string>('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch existing page for edit mode
  const pageQuery = useQuery({
    queryKey: ['wiki-page', identifier, slug],
    queryFn: () =>
      axiosInstance.get<WikiPage>(`/projects/${identifier}/wiki/${slug}`).then((r) => r.data),
    enabled: isEditMode && !!identifier && !!slug,
  });

  // Fetch all pages for parent select
  const pagesQuery = useQuery({
    queryKey: ['wiki-pages', identifier],
    queryFn: () =>
      axiosInstance.get<WikiListItem[]>(`/projects/${identifier}/wiki`).then((r) => r.data),
    enabled: !!identifier,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: '',
  });

  // Load existing page data into editor
  useEffect(() => {
    if (pageQuery.data && editor) {
      setTitle(pageQuery.data.title);
      setParentPageId(pageQuery.data.parentPageId ? String(pageQuery.data.parentPageId) : '');
      editor.commands.setContent(pageQuery.data.contentHtml || '');
    }
  }, [pageQuery.data, editor]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleAddImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor || !identifier) return;
    if (!title.trim()) {
      setSaveError('제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const body = {
      title: title.trim(),
      contentHtml: editor.getHTML(),
      parentPageId: parentPageId ? Number(parentPageId) : null,
      comments: comments.trim() || undefined,
    };

    try {
      if (isEditMode && slug) {
        await axiosInstance.put(`/projects/${identifier}/wiki/${slug}`, body);
        navigate(`/projects/${identifier}/wiki/${slug}`);
      } else {
        const res = await axiosInstance.post(`/projects/${identifier}/wiki`, body);
        const newSlug = res.data?.slug ?? res.data?.title;
        navigate(`/projects/${identifier}/wiki/${newSlug ?? ''}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '저장에 실패했습니다.')
          : '저장에 실패했습니다.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [editor, identifier, title, parentPageId, comments, isEditMode, slug, navigate]);

  if (isEditMode && pageQuery.isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // Filter out current page from parent options to prevent self-reference
  const parentOptions = (pagesQuery.data ?? []).filter((p) => p.slug !== slug);

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
        >
          프로젝트
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}`)}
        >
          {projectQuery.data?.name ?? identifier}
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${identifier}/wiki`)}
        >
          위키
        </Link>
        <Typography color="text.primary">
          {isEditMode ? '위키 편집' : '새 페이지'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(`/projects/${identifier}/wiki${slug ? `/${slug}` : ''}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {isEditMode ? '위키 페이지 수정' : '새 위키 페이지'}
        </Typography>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {/* Title */}
      <TextField
        label="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />

      {/* Parent page select */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>상위 페이지 (선택)</InputLabel>
        <Select
          value={parentPageId}
          label="상위 페이지 (선택)"
          onChange={(e: SelectChangeEvent) => setParentPageId(e.target.value)}
        >
          <MenuItem value="">없음</MenuItem>
          {parentOptions.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
              {p.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tiptap Editor */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
            p: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <HeadingSelect editor={editor} />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToolbarButton
            icon={<FormatBoldIcon fontSize="small" />}
            label="굵게"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold')}
          />
          <ToolbarButton
            icon={<FormatItalicIcon fontSize="small" />}
            label="기울임"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToolbarButton
            icon={<FormatListBulletedIcon fontSize="small" />}
            label="글머리 목록"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList')}
          />
          <ToolbarButton
            icon={<FormatListNumberedIcon fontSize="small" />}
            label="번호 목록"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList')}
          />
          <ToolbarButton
            icon={<ChecklistIcon fontSize="small" />}
            label="체크리스트"
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
            isActive={editor?.isActive('taskList')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToolbarButton
            icon={<LinkIcon fontSize="small" />}
            label="링크"
            onClick={handleAddLink}
            isActive={editor?.isActive('link')}
          />
          <ToolbarButton
            icon={<ImageIcon fontSize="small" />}
            label="이미지"
            onClick={handleAddImage}
          />
          <ToolbarButton
            icon={<TableChartIcon fontSize="small" />}
            label="표 삽입"
            onClick={handleInsertTable}
          />
          <ToolbarButton
            icon={<CodeIcon fontSize="small" />}
            label="코드 블록"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            isActive={editor?.isActive('codeBlock')}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToolbarButton
            icon={<UndoIcon fontSize="small" />}
            label="실행 취소"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
          />
          <ToolbarButton
            icon={<RedoIcon fontSize="small" />}
            label="다시 실행"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
          />
        </Box>

        {/* Editor content */}
        <Box
          sx={{
            p: 2,
            minHeight: 300,
            '& .tiptap': {
              outline: 'none',
              minHeight: 280,
              '& p.is-editor-empty:first-child::before': {
                content: 'attr(data-placeholder)',
                color: 'text.disabled',
                float: 'left',
                height: 0,
                pointerEvents: 'none',
              },
            },
            '& .tiptap table': {
              borderCollapse: 'collapse',
              width: '100%',
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
                minWidth: 50,
              },
              '& th': { bgcolor: 'action.hover', fontWeight: 600 },
            },
            '& .tiptap pre': {
              bgcolor: 'grey.100',
              p: 1.5,
              borderRadius: 1,
            },
            '& .tiptap img': { maxWidth: '100%', height: 'auto' },
            '& .tiptap ul[data-type="taskList"]': {
              listStyle: 'none',
              pl: 0,
              '& li': {
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.5,
              },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Paper>

      {/* Version comment (for edits) */}
      {isEditMode && (
        <TextField
          label="변경 사항 설명"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          fullWidth
          size="small"
          placeholder="이 수정에 대한 설명을 입력하세요"
          sx={{ mb: 2 }}
        />
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/projects/${identifier}/wiki${slug ? `/${slug}` : ''}`)}
        >
          취소
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </Box>
    </Box>
  );
}
