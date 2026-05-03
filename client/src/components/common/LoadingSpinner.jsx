import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
      <div className="text-gray-600 font-medium">Loading...</div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;