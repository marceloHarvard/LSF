import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10 w-auto" }) => {
  return (
    <svg 
      viewBox="0 0 150 60" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LSF BR Logo"
    >
      {/* L Shape (Navy) */}
      <path 
        d="M0 0V60H45V45H15V0H0Z" 
        fill="#1a2b4c" 
      />
      
      {/* S Shape (Navy) - Geometric Block */}
      <path 
        d="M50 0H90V15H65V22.5H90V60H50V45H75V37.5H50V0Z" 
        fill="#1a2b4c"
        opacity="0.95" 
      />
      
      {/* F implied lines (Green) */}
      <rect x="95" y="0" width="45" height="15" rx="2" fill="#4ade80" />
      <rect x="95" y="22.5" width="35" height="15" rx="2" fill="#4ade80" />

      {/* Text */}
      <text 
        x="96" 
        y="58" 
        fontFamily="ui-sans-serif, system-ui, sans-serif" 
        fontSize="15" 
        fontWeight="800" 
        fill="#1a2b4c" 
        letterSpacing="0.5"
      >
        LSF BR
      </text>
    </svg>
  );
};