import React, { useRef, useState } from 'react';
import { Upload, Film, Plus, Trash2 } from 'lucide-react';
import { Asset } from '../types';

interface AssetLibraryProps {
  assets: Asset[];
  onUpload: (files: FileList) => void;
  onAddToTimeline: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ 
  assets, 
  onUpload, 
  onAddToTimeline,
  onDeleteAsset
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
          <Film className="w-4 h-4" /> Assets
        </h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          multiple
          onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
      </div>

      {/* Upload Area / List */}
      <div 
        className={`flex-1 overflow-y-auto p-4 transition-colors ${
          isDragging ? 'bg-zinc-800/50 border-2 border-dashed border-blue-500' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm text-center">Drag videos here<br/>or click + to upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <div 
                key={asset.id} 
                className="group relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-all"
              >
                <div className="aspect-video bg-black flex items-center justify-center">
                  <Film className="text-zinc-600" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate text-zinc-200" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {formatDuration(asset.duration)}
                  </p>
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onAddToTimeline(asset.id)}
                    className="p-1.5 bg-blue-600 rounded-full hover:bg-blue-500 text-white"
                    title="Add to Timeline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1.5 bg-red-600/80 rounded-full hover:bg-red-600 text-white"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};