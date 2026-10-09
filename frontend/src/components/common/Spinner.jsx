import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-16 h-16 border-4'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-[#254546] border-t-transparent ${sizeMap[size] || sizeMap.md} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};
