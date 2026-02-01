# SyllabiQ - Populate All Components Script
Write-Host "`n🚀 Populating all component files with code...`n" -ForegroundColor Cyan

# This script will copy all component code from the previous setup
# Run this after the file structure is created

$componentsCreated = 0

# Input.tsx
$inputCode = @"
import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-text-secondary mb-2'>
            {label}
          </label>
        )}
        <div className='relative'>
          {icon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-text-muted'>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-primary-light border transition-all duration-200',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent',
              error ? 'border-red-500' : 'border-accent-cyan/30',
              icon ? 'pl-10' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className='mt-1 text-sm text-red-500'>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <label className='block text-sm font-medium text-text-secondary mb-2'>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg bg-primary-light border transition-all duration-200',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent',
            'resize-none',
            error ? 'border-red-500' : 'border-accent-cyan/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className='mt-1 text-sm text-red-500'>{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
"@

[System.IO.File]::WriteAllText("$PWD/src/components/ui/Input.tsx", $inputCode)
$componentsCreated++
Write-Host "  ✓ Input.tsx" -ForegroundColor Green

Write-Host "`n✅ Components populated: $componentsCreated" -ForegroundColor Cyan
Write-Host "`nRun npm run dev to start the server" -ForegroundColor Yellow