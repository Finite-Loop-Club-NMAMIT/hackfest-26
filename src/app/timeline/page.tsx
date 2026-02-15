'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Timeline2D from '../../components/timeline/components/Timeline2D';

const TimelineScene = dynamic(() => import('../../components/timeline/components/TimelineScene'), {
  ssr: false,
});

export default function TimelinePage() {
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem('timeline-mode');
    if (saved === '2d') setIs3D(false);
    if (saved === '3d') setIs3D(true);
  }, []);

  const handleToggle = () => {
    setIs3D((prev) => {
      const next = !prev;
      window.localStorage.setItem('timeline-mode', next ? '3d' : '2d');
      return next;
    });
  };

  return (
    <div className="relative w-full h-screen">
      <button
        type="button"
        onClick={handleToggle}
        className="fixed top-6 right-6 z-9999 transition-transform duration-300 hover:scale-105"
        aria-label="Toggle 2D and 3D mode"
      >
        <div className="relative w-28 h-9 rounded-full bg-linear-to-r from-slate-900 to-slate-700 border border-white/20 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold tracking-widest text-white">
            <span className={is3D ? 'opacity-100' : 'opacity-40'}>3D</span>
            <span className={!is3D ? 'opacity-100' : 'opacity-40'}>2D</span>
          </div>
          <div
            className="absolute top-0.5 left-0.5 w-8 h-8 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center shadow-lg transition-transform duration-300"
            style={{
              transform: is3D ? 'translateX(0px)' : 'translateX(52px)',
            }}
          >
            {is3D ? '3D' : '2D'}
          </div>
        </div>
      </button>

      {is3D ? <TimelineScene /> : <Timeline2D />}
    </div>
  );
}