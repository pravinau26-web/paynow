import React, { useEffect, useState } from 'react';
import { Battery, Wifi } from 'lucide-react';

interface StatusBarProps {
  dark?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ dark = false }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const textColor = dark ? 'text-white' : 'text-slate-900';

  return (
    <div className={`w-full px-6 pt-2 pb-1 flex items-center justify-between text-xs font-semibold tracking-tight select-none z-30 ${textColor}`}>
      {/* Time */}
      <span className="font-mono text-[13px] tracking-normal font-bold">
        {time || '09:41'}
      </span>

      {/* Camera punch-hole space in center */}
      <div className="w-4 h-4 rounded-full bg-black/90 pointer-events-none mx-auto opacity-75 shadow-inner" />

      {/* Network & Battery icons */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="text-[10px] font-bold tracking-wider">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <Battery className="w-4 h-4 fill-current" />
          <span className="text-[10px] font-mono">98%</span>
        </div>
      </div>
    </div>
  );
};
