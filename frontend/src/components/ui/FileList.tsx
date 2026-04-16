import { FileText, Image, Trash2, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id: number;
  file_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  description?: string;
  uploaded_at: string;
}

interface FileListProps {
  files: FileItem[];
  onDelete?: (id: number) => void;
  canDelete?: boolean;
  showCaption?: boolean;
  className?: string;
}

export function FileList({ files, onDelete, canDelete = false, showCaption = true, className }: FileListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">No files uploaded</p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => {
        const Icon = getFileIcon(file.mime_type);
        return (
          <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
            {isImage(file.mime_type) ? (
              <img
                src={file.file_url}
                alt={file.original_filename}
                className="h-12 w-12 object-cover rounded"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                <Icon className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.original_filename}</p>
              {showCaption && (file.caption || file.description) && (
                <p className="text-xs text-gray-500 truncate">{file.caption || file.description}</p>
              )}
              <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 rounded-full"
                title="View file"
              >
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </a>
              <a
                href={file.file_url}
                download={file.original_filename}
                className="p-2 hover:bg-gray-200 rounded-full"
                title="Download file"
              >
                <Download className="h-4 w-4 text-gray-500" />
              </a>
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(file.id)}
                  className="p-2 hover:bg-red-100 rounded-full"
                  title="Delete file"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
