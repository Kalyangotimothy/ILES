import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StructuredTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  prompts?: string[];
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function StructuredTextarea({
  id,
  label,
  value,
  onChange,
  prompts = [],
  placeholder,
  required = false,
  rows = 4,
  className,
}: StructuredTextareaProps) {
  const [showPrompts, setShowPrompts] = useState(true);

  const insertPrompt = (prompt: string) => {
    const newValue = value
      ? `${value}\n\n${prompt}: `
      : `${prompt}: `;
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Guided Prompts */}
      {prompts.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPrompts(!showPrompts)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Guiding prompts (click to add)
            </span>
            {showPrompts ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showPrompts && (
            <div className="p-2 space-y-1 bg-white">
              {prompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertPrompt(prompt)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
