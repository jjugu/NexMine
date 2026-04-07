import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Button, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme,
  Breadcrumbs, Link, Collapse, Skeleton, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import axiosInstance from '../../../api/axiosInstance';
import WikiPageView from './WikiPageView';
import WikiVersionHistory from './WikiVersionHistory';

const SIDEBAR_WIDTH = 250;

interface WikiListItem {
  id: number;
  title: string;
  slug: string;
  parentPageId: number | null;
  authorName: string;
  version: number;
  updatedAt: string;
}

interface TreeNode {
  item: WikiListItem;
  children: TreeNode[];
}

function buildTree(items: WikiListItem[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentPageId && map.has(item.parentPageId)) {
      map.get(item.parentPageId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedSlug?: string;
  onSelect: (slug: string) => void;
}

function TreeItem({ node, level, selectedSlug, onSelect }: TreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.item.slug === selectedSlug;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => onSelect(node.item.slug)}
        sx={{ pl: 1 + level * 2, borderRadius: 1, py: 0.5 }}
      >
        {hasChildren ? (
          <ListItemIcon
            sx={{ minWidth: 24, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            )}
          </ListItemIcon>
        ) : (
          <ListItemIcon sx={{ minWidth: 24 }}>
            <ArticleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </ListItemIcon>
        )}
        <ListItemText
          primary={node.item.title}
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
        />
      </ListItemButton>
      {hasChildren && (
        <Collapse in={expanded}>
          {node.children.map((child) => (
            <TreeItem
              key={child.item.id}
              node={child}
              level={level + 1}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

export default function WikiIndexPage() {
  const { identifier, slug } = useParams<{ identifier: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showHistory = (location.state as { showHistory?: boolean } | null)?.showHistory === true;

  const pagesQuery = useQuery({
    queryKey: ['wiki-pages', identifier],
    queryFn: () =>
      axiosInstance.get<WikiListItem[]>(`/projects/${identifier}/wiki`).then((r) => r.data),
    enabled: !!identifier,
  });

  const tree = useMemo(() => buildTree(pagesQuery.data ?? []), [pagesQuery.data]);

  const handleSelectPage = useCallback(
    (pageSlug: string) => {
      navigate(`/projects/${identifier}/wiki/${pageSlug}`);
      if (isMobile) setDrawerOpen(false);
    },
    [identifier, navigate, isMobile],
  );

  const handleDeleted = useCallback(() => {
    navigate(`/projects/${identifier}/wiki`);
  }, [identifier, navigate]);

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          위키 페이지
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            navigate(`/projects/${identifier}/wiki/new`);
            if (isMobile) setDrawerOpen(false);
          }}
        >
          새 페이지
        </Button>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
        {pagesQuery.isLoading && (
          <Box sx={{ p: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="text" height={32} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        )}
        {!pagesQuery.isLoading && tree.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              아직 위키 페이지가 없습니다.
            </Typography>
          </Box>
        )}
        <List dense disablePadding>
          {tree.map((node) => (
            <TreeItem
              key={node.item.id}
              node={node}
              level={0}
              selectedSlug={slug}
              onSelect={handleSelectPage}
            />
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(true)} edge="start">
            <MenuIcon />
          </IconButton>
        )}
        <Breadcrumbs>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate(`/projects/${identifier}`)}
          >
            {identifier}
          </Link>
          <Typography color="text.primary">위키</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', gap: 0 }}>
        {/* Sidebar */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH } }}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              mr: 2,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Content area */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {showHistory && slug ? (
            <WikiVersionHistory />
          ) : (
            <WikiPageView slug={slug} onDeleted={handleDeleted} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

