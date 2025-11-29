import { API_BASE } from '../constants';
import { ExtractionRequest, JobStatusResponse, VideoInfo } from '../types';

const getCacheBuster = () => `?cb=${Math.random()}`;

export const api = {
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const resp = await fetch(`${API_BASE}/video-info${getCacheBuster()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!resp.ok) throw new Error('Failed to get video information');
    return await resp.json();
  },

  async createExtractionJob(data: ExtractionRequest): Promise<JobStatusResponse> {
    const resp = await fetch(`${API_BASE}/extract${getCacheBuster()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create extraction job');
    }
    return await resp.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const resp = await fetch(`${API_BASE}/jobs/${jobId}${getCacheBuster()}`);
    if (!resp.ok) throw new Error('Failed to get job status');
    return await resp.json();
  },

  async cancelJob(jobId: string): Promise<any> {
    const resp = await fetch(`${API_BASE}/jobs/${jobId}/cancel${getCacheBuster()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!resp.ok) throw new Error('Failed to cancel job');
    return await resp.json();
  },

  getDownloadUrl(jobId: string): string {
    return `${API_BASE}/download/${jobId}${getCacheBuster()}`;
  }
};