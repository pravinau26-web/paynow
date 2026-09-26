import React from 'react';

interface StatusBarProps {
  dark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = () => {
  // Status bar (time, 5G, battery %, wifi, punch-hole) completely removed as requested
  return null;
};

