import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onLockApp?: () => void;
  isLocked?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen h-[100dvh] bg-[#FAFAFC] text-slate-900 flex flex-col overflow-hidden relative selection:bg-[#5B3DF5]/30 selection:text-white">
      {/* Full-width seamless container directly filling the entire mobile/desktop screen without mock frame or borders */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
};
