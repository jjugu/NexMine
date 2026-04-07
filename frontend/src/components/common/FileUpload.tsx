import { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, LinearProgress, List, ListItem,
  ListItemText, ListItemSecondaryAction, Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadedFile {
  file: File;
  progress: number;
  error?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ files, onFilesChange, multiple = true, accept }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const toAdd: UploadedFile[] = [];
    for (const file of Array.from(newFiles)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`파일 "${file.name}"의 크기가 50MB를 초과합니다.`);
        continue;
      }
      toAdd.push({ file, progress: 0 });
    }
    if (toAdd.length > 0) {
      onFilesChange(multiple ? [...files, ...toAdd] : toAdd.slice(0, 1));
    }
  }, [files, multiple, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAdd(e.dataTransfer.files);
    }
  }, [validateAndAdd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAdd(e.target.files);
    }
    // Reset to allow re-selection of same file
    e.target.value = '';
  }, [validateAndAdd]);

  const handleRemove = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          파일을 드래그하거나 클릭하여 업로드
        </Typography>
        <Typography variant="caption" color="text.disabled">
          최대 50MB
        </Typography>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {files.length > 0 && (
        <List dense sx={{ mt: 1 }}>
          {files.map((f, index) => (
            <ListItem key={`${f.file.name}-${index}`} sx={{ px: 1 }}>
              <InsertDriveFileIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <ListItemText
                primary={f.file.name}
                secondary={formatFileSize(f.file.size)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              {f.progress > 0 && f.progress < 100 && (
                <Box sx={{ width: 80, mr: 1 }}>
                  <LinearProgress variant="determinate" value={f.progress} />
                </Box>
              )}
              {f.error && (
                <Typography variant="caption" color="error" sx={{ mr: 1 }}>
                  {f.error}
                </Typography>
              )}
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => handleRemove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
