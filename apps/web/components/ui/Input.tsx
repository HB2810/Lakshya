import React from 'react';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3 py-2 text-sm bg-white border border-workspace-border rounded-md shadow-subtle placeholder:text-text-muted focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error ? 'border-brand-red focus:border-brand-red focus:ring-brand-red' : ''
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-brand-red font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          ref={ref}
          type="text"
          className={`w-full pl-9 pr-3 py-2 text-sm bg-white border border-workspace-border rounded-md shadow-subtle placeholder:text-text-muted focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${className}`}
          placeholder="Search..."
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
