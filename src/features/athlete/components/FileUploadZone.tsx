import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { surface, primary, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

export interface FileUploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = ['.fit'];

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function FileUploadZone({ onFileSelected, disabled = false }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (disabled || !files || files.length === 0) return;
    const file = files[0];
    if (!hasAcceptedExtension(file.name)) return;
    onFileSelected(file);
  }, [disabled, onFileSelected]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  return (
    <Box
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      aria-label="Selecionar arquivo .fit"
      sx={{
        border: `2px dashed ${isDragOver ? primary[500] : content.cardBorder}`,
        borderRadius: 2,
        bgcolor: isDragOver ? content.cardBgHover : elevation.card,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s ease',
        textAlign: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".fit,.FIT"
        hidden
        disabled={disabled}
        onChange={handleInputChange}
      />
      <CloudUpload sx={{ color: isDragOver ? primary[500] : surface[400], fontSize: '2rem' }} />
      <Typography sx={{ color: surface[50], fontSize: '0.9rem', fontWeight: 700 }}>
        Arraste um arquivo .fit ou clique para selecionar
      </Typography>
      <Typography sx={{ color: surface[500], fontSize: '0.75rem' }}>
        Exportado do seu relógio/dispositivo GPS (Garmin, Wahoo, etc.)
      </Typography>
    </Box>
  );
}

export default FileUploadZone;
