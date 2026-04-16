import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import type { FileUploadProgress } from '@/types';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  uploadProgress?: FileUploadProgress[];
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5,
  multiple = false,
  onFilesSelected,
  uploadProgress = [],
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    files.forEach((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        newErrors.push(`${file.name}: File exceeds ${maxSize}MB limit`);
        return;
      }

      // Check file type
      const allowedTypes = accept.split(',').map((t) => t.trim());
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.some((type) => extension === type || file.type.includes(type.replace('.', '')))) {
        newErrors.push(`${file.name}: File type not allowed`);
        return;
      }

      validFiles.push(file);
    });

    setErrors(newErrors);
    return validFiles;
  }, [accept, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(multiple ? files : [files[0]]);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [disabled, multiple, validateFiles, onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const files = Array.from(e.target.files);
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset input
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
        <p className="text-sm font-medium text-gray-900">
          {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept.replace(/\./g, '').toUpperCase()} up to {maxSize}MB
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => {
            const Icon = getFileIcon(item.file.type);
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                {item.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                {item.status === 'complete' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {item.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
