import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetLibrary } from './components/AssetLibrary';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Timeline } from './components/Timeline';
import { Asset, TrackItem } from './types';
import { Scissors } from 'lucide-react';

// Sample assets for demo purposes if needed, currently empty
const INITIAL_ASSETS: Asset[] = [];

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [trackItems, setTrackItems] = useState<TrackItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(30); // 30 pixels per second
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Calculate total duration based on the end of the last clip
  const totalDuration = trackItems.reduce((acc, item) => Math.max(acc, item.start + item.duration), 0);

  // Playback Loop
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const delta = (time - lastTimeRef.current) / 1000;
      setCurrentTime((prev) => {
        const nextTime = prev + delta;
        if (nextTime >= totalDuration && totalDuration > 0) {
          setIsPlaying(false);
          return totalDuration;
        }
        return nextTime;
      });
    }
    lastTimeRef.current = time;
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, animate]);

  // Handlers
  const handleUpload = async (files: FileList) => {
    const newAssets: Asset[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      
      // Get Duration
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        video.onerror = () => resolve(0);
        video.src = url;
      });

      newAssets.push({
        id: Math.random().toString(36).substr(2, 9),
        url,
        name: file.name,
        duration,
        type: 'video'
      } as Asset);
    }

    setAssets((prev) => [...prev, ...newAssets]);
  };

  const handleAddToTimeline = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const newItem: TrackItem = {
      id: Math.random().toString(36).substr(2, 9),
      assetId: asset.id,
      start: totalDuration, // Append to end
      duration: asset.duration,
      offset: 0,
      trackId: 0
    };

    setTrackItems((prev) => [...prev, newItem]);
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    // Also remove from timeline
    setTrackItems(prev => prev.filter(item => item.assetId !== assetId));
  };

  const handleDeleteTimelineItem = (itemId: string) => {
    setTrackItems(prev => {
        const filtered = prev.filter(i => i.id !== itemId);
        // Optional: Shift subsequent clips left to close gap? 
        // For this simple editor, let's just delete leaving a gap is easier, 
        // but let's recalculate starts to snap left for better UX (Ripple delete)
        let currentStart = 0;
        return filtered.map(item => {
            const newItem = { ...item, start: currentStart };
            currentStart += item.duration;
            return newItem;
        });
    });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(Math.min(Math.max(0, time), totalDuration));
    if (isPlaying) setIsPlaying(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Bar */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded-lg">
             <Scissors className="w-4 h-4 text-white" />
           </div>
           <h1 className="font-bold text-lg tracking-tight">ReactVideoCut</h1>
        </div>
        <div className="text-xs text-zinc-500">v1.0.0</div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Assets */}
        <div className="w-80 flex-shrink-0">
          <AssetLibrary 
            assets={assets}
            onUpload={handleUpload}
            onAddToTimeline={handleAddToTimeline}
            onDeleteAsset={handleDeleteAsset}
          />
        </div>

        {/* Center/Right: Preview */}
        <div className="flex-1 bg-black flex flex-col">
          <PreviewPlayer 
            isPlaying={isPlaying}
            currentTime={currentTime}
            assets={assets}
            trackItems={trackItems}
            totalDuration={totalDuration}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSeek={handleSeek}
          />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-72 border-t border-zinc-800 flex-shrink-0 relative z-10">
        {/* Timeline Controls (Zoom) */}
        <div className="absolute top-2 right-4 z-20 flex gap-2">
          <button 
             onClick={() => setScale(Math.max(5, scale - 5))}
             className="bg-zinc-800 text-xs px-2 py-1 rounded hover:bg-zinc-700"
          >
            - Zoom
          </button>
          <button 
             onClick={() => setScale(Math.min(100, scale + 5))}
             className="bg-zinc-800 text-xs px-2 py-1 rounded hover:bg-zinc-700"
          >
            + Zoom
          </button>
        </div>
        
        <Timeline 
          trackItems={trackItems}
          assets={assets}
          currentTime={currentTime}
          totalDuration={totalDuration}
          scale={scale}
          onSeek={handleSeek}
          onDeleteItem={handleDeleteTimelineItem}
        />
      </div>
    </div>
  );
}