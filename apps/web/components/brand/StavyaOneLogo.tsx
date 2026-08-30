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

  // Minimalist Apple-Style Monochrome Mark
  const renderMark = () => (
    <div className={`shrink-0 ${markSize} flex items-center justify-center ${markColor} transition-transform group-hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
        {/* Upper Apex Node */}
        <circle cx="58" cy="18" r="4.5" />
        
        {/* Minimalist Spinal & Numeral 1 Stem */}
        <path d="M 44 26 C 40 26, 36 28, 33 32 C 30.5 35.5, 31.5 39, 35 41 C 41 44.5, 52 41, 56 36 L 56 74 C 56 77.5, 53 80.5, 49 80.5 L 43 80.5 C 40.8 80.5, 39 82.3, 39 84.5 C 39 86.7, 40.8 88.5, 43 88.5 L 67 88.5 C 69.2 88.5, 71 86.7, 71 84.5 C 71 82.3, 69.2 80.5, 67 80.5 L 63 80.5 C 59 80.5, 56 77.5, 56 74 L 56 26 Z" />
        
        {/* Vertebral Balance Bars */}
        <rect x="25" y="47" width="16" height="5.5" rx="2.75" />
        <rect x="23" y="58" width="18" height="5.5" rx="2.75" />
        <rect x="26" y="69" width="15" height="5.5" rx="2.75" />
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{renderMark()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {renderMark()}

      <div className="flex flex-col leading-none">
        <div className={`tracking-tight font-sans ${fontSize} ${textColor} flex items-center`}>
          <span className="font-normal opacity-90">Stavya</span>
          <span className="font-extrabold tracking-tight">One</span>
        </div>

        {showSubtitle && variant === 'full' && (
          <span className={`text-[9px] font-semibold tracking-wider uppercase mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Operating System
          </span>
        )}
      </div>
    </div>
  );
};
