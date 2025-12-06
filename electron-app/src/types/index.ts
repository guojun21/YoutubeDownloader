export interface VideoInfo {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnailUrl: string;
}

export interface SearchResult {
  kind: string;
  title: string;
  videos: VideoInfo[];
}

export interface DownloadOption {
  container: string;
  quality: string;
  size: string;
}

export interface DownloadProgress {
  status: string;
  percentage: number;
  fileName?: string;
  filePath?: string;
  error?: string;
}

export interface DownloadItem {
  id: string;
  downloadId: string;
  video: VideoInfo;
  option: DownloadOption;
  progress: DownloadProgress;
}

declare global {
  interface Window {
    electronAPI?: {
      getBackendUrl: () => Promise<string>;
    };
  }
}

