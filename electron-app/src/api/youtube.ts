import axios from 'axios';
import type { SearchResult, DownloadOption, DownloadProgress } from '../types';

const BASE_URL = 'http://localhost:5123/api/youtube';

export const api = {
  async search(query: string): Promise<SearchResult> {
    const response = await axios.get(`${BASE_URL}/search`, { params: { query } });
    return response.data;
  },

  async getOptions(videoId: string): Promise<DownloadOption[]> {
    const response = await axios.get(`${BASE_URL}/options/${videoId}`);
    return response.data;
  },

  async startDownload(
    videoId: string,
    container: string,
    quality: string,
    outputPath?: string
  ): Promise<string> {
    const response = await axios.post(`${BASE_URL}/download`, {
      videoId,
      container,
      quality,
      outputPath,
    });
    return response.data.downloadId;
  },

  async getProgress(downloadId: string): Promise<DownloadProgress> {
    const response = await axios.get(`${BASE_URL}/progress/${downloadId}`);
    return response.data;
  },
};

