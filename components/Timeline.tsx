import React, { useRef, useEffect } from 'react';
import { TrackItem, Asset } from '../types';

interface TimelineProps {
  trackItems: TrackItem[];
  assets: Asset[];
  currentTime: number;
  totalDuration: number;
  scale: number; // pixels per second
  onSeek: (time: number) => void;
  onDeleteItem: (itemId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  trackItems,
  assets,
  currentTime,
  totalDuration,
  scale,
  onSeek,
  onDeleteItem
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline when playing to keep playhead in view
  useEffect(() => {
    if (containerRef.current) {
      const playheadPos = currentTime * scale;
      const containerWidth = containerRef.current.clientWidth;
      const scrollLeft = containerRef.current.scrollLeft;
      
      // Simple follow logic: if playhead goes near right edge, scroll
      if (playheadPos > scrollLeft + containerWidth * 0.8) {
        containerRef.current.scrollTo({ left: playheadPos - containerWidth * 0.2, behavior: 'smooth' });
      }
    }
  }, [currentTime, scale]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const newTime = Math.max(0, clickX / scale);
    onSeek(newTime);
  };

  const formatTimeMarker = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Generate ticks
  const ticks = [];
  const tickInterval = 5; // every 5 seconds
  const viewDuration = Math.max(totalDuration + 10, 60); // Minimum 1 minute view
  
  for (let i = 0; i <= viewDuration; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 select-none">
      {/* Time Ruler */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
        onMouseDown={handleTimelineClick}
      >
        <div 
          className="h-8 border-b border-zinc-700 bg-zinc-850 relative min-w-full"
          style={{ width: `${viewDuration * scale}px` }}
        >
          {ticks.map((t) => (
            <div 
              key={t} 
              className="absolute bottom-0 text-[10px] text-zinc-500 border-l border-zinc-700 pl-1 h-3"
              style={{ left: `${t * scale}px` }}
            >
              {formatTimeMarker(t)}
            </div>
          ))}
        </div>

        {/* Tracks Area */}
        <div 
          className="relative min-w-full pt-4 pb-12"
          style={{ width: `${viewDuration * scale}px` }}
        >
          {/* Main Track (Track 0) */}
          <div className="h-24 bg-zinc-950/50 relative border-y border-zinc-800/50">
             {trackItems.map((item) => {
               const asset = assets.find(a => a.id === item.assetId);
               return (
                 <div
                    key={item.id}
                    className="absolute top-2 h-20 rounded-md overflow-hidden bg-blue-900/40 border border-blue-500/50 group cursor-pointer hover:bg-blue-800/40"
                    style={{
                      left: `${item.start * scale}px`,
                      width: `${item.duration * scale}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Don't seek when clicking clip for now
                      // Select clip logic could go here
                    }}
                 >
                    {/* Clip Content */}
                    <div className="px-2 py-1 flex flex-col h-full justify-between">
                      <span className="text-xs text-blue-100 truncate font-medium drop-shadow-md">
                        {asset?.name || 'Unknown Clip'}
                      </span>
                      
                      {/* Thumbnails (Simulated) */}
                      <div className="flex gap-1 overflow-hidden opacity-30 h-8">
                        {Array.from({ length: Math.max(1, Math.floor(item.duration / 5)) }).map((_, i) => (
                           <div key={i} className="w-8 h-full bg-white/10 rounded-sm flex-shrink-0" />
                        ))}
                      </div>
                    </div>

                    {/* Clip Actions (Hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                    </button>
                 </div>
               );
             })}
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-50 pointer-events-none flex flex-col items-center"
            style={{ left: `${currentTime * scale}px` }}
          >
            <div className="w-3 h-3 -mt-1.5 bg-red-500 rotate-45 transform" />
          </div>
        </div>
      </div>
    </div>
  );
};