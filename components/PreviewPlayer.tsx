import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Monitor } from 'lucide-react';
import { Asset, TrackItem } from '../types';

interface PreviewPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  assets: Asset[];
  trackItems: TrackItem[];
  totalDuration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  isPlaying,
  currentTime,
  assets,
  trackItems,
  totalDuration,
  onTogglePlay,
  onSeek
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeItem, setActiveItem] = useState<TrackItem | null>(null);

  // Find which clip should be playing at the current global timeline time
  useEffect(() => {
    const item = trackItems.find(
      (item) => currentTime >= item.start && currentTime < item.start + item.duration
    );
    setActiveItem(item || null);
  }, [currentTime, trackItems]);

  // Sync the actual video element with the virtual timeline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeItem) {
      const asset = assets.find(a => a.id === activeItem.assetId);
      if (asset) {
        // Only update source if it's different to prevent flickering
        // Note: In a real app, you'd use two video elements and crossfade to avoid black frames on switch
        const currentSrc = video.getAttribute('src');
        if (currentSrc !== asset.url) {
          video.src = asset.url;
        }

        // Calculate local time within the clip
        const localTime = currentTime - activeItem.start + activeItem.offset;
        
        // Only set currentTime if the difference is significant (drift correction)
        // This allows the video to play smoothly without constant seeking
        if (Math.abs(video.currentTime - localTime) > 0.3) {
           video.currentTime = localTime;
        }

        if (isPlaying && video.paused) {
          video.play().catch(() => {});
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    } else {
      // No clip at this time
      video.removeAttribute('src'); 
      video.load(); // clear
    }
  }, [activeItem, assets, isPlaying, currentTime]); // Removing currentTime from deps would break seeking, but keeping it might cause stutter. 
  // Refined Logic: We depend on 'activeItem' for src changes. 
  // For time updates, if we rely solely on the video element's natural playback, we might drift from the React state 'currentTime'.
  // However, updating video.currentTime on every React render is bad for performance. 
  // The 'drift correction' logic above handles this.

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950">
        {activeItem ? (
          <video 
            ref={videoRef}
            className="max-h-full max-w-full shadow-2xl"
            muted={false} // Allow audio
            playsInline
            // We disable native controls because we control it via the global timeline
            controls={false}
          />
        ) : (
          <div className="flex flex-col items-center text-zinc-700">
            <Monitor className="w-16 h-16 mb-2 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-semibold opacity-40">No Signal</p>
          </div>
        )}
        
        {/* Overlay Info */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white/80">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="h-14 border-t border-zinc-800 bg-zinc-900 flex items-center justify-center gap-4 px-4">
        <button 
          onClick={() => onSeek(0)}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onTogglePlay}
          className="p-3 bg-white hover:bg-zinc-200 rounded-full text-black transition-colors transform active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <button 
          onClick={() => onSeek(totalDuration)}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};