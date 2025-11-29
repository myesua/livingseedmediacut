export interface VideoInfo {
  title: string;
  duration: number;
  uploader: string;
  thumbnail?: string;
}

export type OutputFormat = 'mp3' | 'wav' | 'mp4';

export interface ExtractionRequest {
  url: string;
  start_time: string | null;
  end_time: string | null;
  output_format: OutputFormat;
  filename?: string;
  topic?: string;
  preacher?: string;
  extract_full: boolean;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'created' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: string;
  percent?: number;
  error?: string;
  download_url?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  format: OutputFormat;
  filename?: string;
  timestamp: string;
  downloadUrl?: string; // Constructed client-side usually
}

export interface ApiError {
  detail: string;
}