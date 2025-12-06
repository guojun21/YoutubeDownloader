import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download, Settings, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from './api/youtube';
import type { VideoInfo, DownloadOption, DownloadItem } from './types';
import './App.css';

function App() {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [options, setOptions] = useState<DownloadOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search videos
  const handleSearch = async () => {
    const query = inputRef.current?.value || '';
    console.log('handleSearch called, query:', query);
    if (!query.trim()) {
      console.log('Query is empty, returning');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling API search...');
      const result = await api.search(query);
      console.log('Search result:', result);
      setVideos(result.videos);
    } catch (err: unknown) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get download options for a video
  const handleSelectVideo = async (video: VideoInfo) => {
    setSelectedVideo(video);
    setLoadingOptions(true);
    
    try {
      const opts = await api.getOptions(video.id);
      setOptions(opts);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get options';
      setError(errorMessage);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Start download
  const handleDownload = async (option: DownloadOption) => {
    if (!selectedVideo) return;

    try {
      const downloadId = await api.startDownload(
        selectedVideo.id,
        option.container,
        option.quality
      );

      const newDownload: DownloadItem = {
        id: `${selectedVideo.id}-${Date.now()}`,
        downloadId,
        video: selectedVideo,
        option,
        progress: { status: 'Starting', percentage: 0 },
      };

      setDownloads(prev => [newDownload, ...prev]);
      setSelectedVideo(null);
      setOptions([]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
    }
  };

  // Poll download progress
  const updateProgress = useCallback(async () => {
    const activeDownloads = downloads.filter(
      d => d.progress.status !== 'Completed' && d.progress.status !== 'Failed'
    );

    for (const download of activeDownloads) {
      try {
        const progress = await api.getProgress(download.downloadId);
        setDownloads(prev =>
          prev.map(d =>
            d.id === download.id ? { ...d, progress } : d
          )
        );
      } catch {
        // Ignore errors
      }
    }
  }, [downloads]);

  useEffect(() => {
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [updateProgress]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Paste YouTube URL or search..."
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : 'Search'}
          </button>
        </div>
        <button className="settings-btn">
          <Settings size={20} />
        </button>
      </header>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Main content */}
      <main className="main">
        {/* Downloads section */}
        {downloads.length > 0 && (
          <section className="downloads-section">
            <h2><Download size={18} /> Downloads</h2>
            <div className="downloads-list">
              {downloads.map(download => (
                <div key={download.id} className="download-item">
                  <img src={download.video.thumbnailUrl} alt="" />
                  <div className="download-info">
                    <h4>{download.video.title}</h4>
                    <p>{download.option.quality} • {download.option.container}</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${download.progress.percentage}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {download.progress.status === 'Completed' ? (
                        <><Check size={14} /> Completed</>
                      ) : download.progress.status === 'Failed' ? (
                        <><AlertCircle size={14} /> {download.progress.error}</>
                      ) : (
                        <><Loader2 className="spin" size={14} /> {download.progress.percentage}%</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search results */}
        {videos.length > 0 && (
          <section className="videos-section">
            <h2>Search Results</h2>
            <div className="videos-grid">
              {videos.map(video => (
                <div 
                  key={video.id} 
                  className="video-card"
                  onClick={() => handleSelectVideo(video)}
                >
                  <div className="thumbnail">
                    <img src={video.thumbnailUrl} alt="" />
                    <span className="duration">{video.duration}</span>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p>{video.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {videos.length === 0 && downloads.length === 0 && !loading && (
          <div className="empty-state">
            <Download size={64} strokeWidth={1} />
            <h2>YouTube Downloader</h2>
            <p>Paste a YouTube URL or search for videos to get started</p>
          </div>
        )}
      </main>

      {/* Download options modal */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVideo(null)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <img src={selectedVideo.thumbnailUrl} alt="" />
              <div>
                <h3>{selectedVideo.title}</h3>
                <p>{selectedVideo.author}</p>
              </div>
            </div>
            <div className="modal-body">
              <h4>Select format</h4>
              {loadingOptions ? (
                <div className="loading-options">
                  <Loader2 className="spin" size={24} />
                  <span>Loading options...</span>
                </div>
              ) : (
                <div className="options-list">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      className="option-btn"
                      onClick={() => handleDownload(option)}
                    >
                      <span className="option-quality">{option.quality}</span>
                      <span className="option-container">{option.container}</span>
                      <span className="option-size">{option.size}</span>
                      <Download size={16} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
