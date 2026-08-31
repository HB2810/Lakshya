'use client';

import React from 'react';

export interface StavyaOneLogoProps {
  variant?: 'full' | 'compact' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  showSubtitle?: boolean;
  className?: string;
}

export const StavyaOneLogo: React.FC<StavyaOneLogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'light',
  showSubtitle = false,
  className = '',
}) => {
  const isDark = theme === 'dark';

  // Sizing tokens
  const markSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }[size];

  const fontSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const markColor = isDark ? 'text-white' : 'text-slate-900';

  const renderMark = () => (
    <div className={`shrink-0 ${markSize} flex items-center justify-center ${markColor} transition-transform group-hover:scale-105`}>
      <img src="/brand/stavya-mark.svg" className="w-full h-full object-contain" alt="Stavya Mark" />
    </div>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{renderMark()}</div>;
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img src="/brand/stavya-logo.png" className="h-10 w-auto object-contain" alt="Stavya Spine Hospital Logo" />
    </div>
  );
};
