import DOMPurify from 'dompurify';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface SafeHtmlProps {
  html: string;
  sx?: SxProps<Theme>;
}

export default function SafeHtml({ html, sx }: SafeHtmlProps) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
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
