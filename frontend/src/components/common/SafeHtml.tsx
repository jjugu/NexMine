import DOMPurify from 'dompurify';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'blockquote', 'pre', 'code',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'a', 'img', 'em', 'strong', 'b', 'i', 'u', 's', 'del', 'ins',
    'sub', 'sup', 'mark', 'small', 'abbr',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'div', 'span', 'figure', 'figcaption',
    'details', 'summary',
    'input', // for task list checkboxes
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'width', 'height',
    'class', 'id', 'target', 'rel',
    'colspan', 'rowspan', 'scope', 'headers',
    'type', 'checked', 'disabled', 'data-type', 'data-checked',
    'start', 'reversed',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

interface SafeHtmlProps {
  html: string;
  sx?: SxProps<Theme>;
}

export default function SafeHtml({ html, sx }: SafeHtmlProps) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, PURIFY_CONFIG) }}
      sx={{
        '& img': { maxWidth: '100%', height: 'auto' },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
          },
          '& th': { bgcolor: 'action.hover', fontWeight: 600 },
        },
        '& pre': {
          bgcolor: 'grey.100',
          p: 1.5,
          borderRadius: 1,
          overflow: 'auto',
        },
        '& code': {
          bgcolor: 'grey.100',
          px: 0.5,
          borderRadius: 0.5,
          fontSize: '0.875em',
        },
        '& ul[data-type="taskList"]': {
          listStyle: 'none',
          pl: 0,
          '& li': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
          },
        },
        '& a': { color: 'primary.main' },
        '& h1, & h2, & h3': { mt: 2, mb: 1 },
        '& p': { mb: 1 },
        ...sx,
      }}
    />
  );
}
