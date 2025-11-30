export interface Asset {
  id: string;
  url: string;
  name: string;
  duration: number; // in seconds
  thumbnail?: string;
}

export interface TrackItem {
  id: string;
  assetId: string;
  start: number; // Start time on the timeline (seconds)
  duration: number; // Duration of the clip on timeline (seconds)
  offset: number; // Start time within the source video (seconds)
  trackId: number; // For multi-track support (simplified to 1 for now)
}

export interface EditorState {
  currentTime: number;
  isPlaying: boolean;
  duration: number; // Total timeline duration
  scale: number; // Pixels per second
}