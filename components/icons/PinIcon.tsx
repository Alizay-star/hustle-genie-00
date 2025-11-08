import React from 'react';

export const PinIcon: React.FC<React.SVGProps<SVGSVGElement> & { isPinned?: boolean }> = ({ isPinned, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 21V11" 
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isPinned ? "currentColor" : "none"}
      d="M16.5 3.75h-9A1.5 1.5 0 006 5.25v3.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-3.5a1.5 1.5 0 00-1.5-1.5z"
    />
  </svg>
);