'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Paperclip, X, FileText, AlertCircle } from 'lucide-react';
import { isAllowedFileType, MAX_ATTACHMENT_SIZE_BYTES, MAX_ATTACHMENT_SIZE_MB } from '@/lib/validations/email';
import { formatFileSize, cn } from '@/lib/utils';

interface AttachmentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxSizeMB?: number;
}

export function AttachmentUpload({
  files,
  onFilesChange,
  maxSizeMB = MAX_ATTACHMENT_SIZE_MB,
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);
    const validFiles: File[] = [...files];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      // Validate file type
      if (!isAllowedFileType(file)) {
        setError(`"${file.name}" file type allowed nahi hai.`);
        continue;
      }

      // Validate size
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setError(`"${file.name}" size ${maxSizeMB}MB se zyada hai.`);
        continue;
      }

      validFiles.push(file);
    }

    onFilesChange(validFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    processFiles(e.target.files);
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    onFilesChange(next);
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerSelect}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 bg-muted/10 border-border/60 hover:bg-muted/20 hover:border-patr-orange/40',
          dragActive && 'border-patr-orange bg-patr-orange/[0.02]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <UploadCloud className="w-8 h-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Drop your files here, or <span className="text-patr-orange underline">browse</span>
          </p>
          <p className="text-[10px] text-muted-foreground/80 mt-1">
            Max size: {maxSizeMB}MB (PDF, DOCX, ZIP, Images, MP4)
          </p>
        </div>
      </div>

      {/* Attached Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/10 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default AttachmentUpload;
