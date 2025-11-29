import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Youtube, 
  Download, 
  Loader2, 
  CheckCircle,
  FileVideo,
  FileAudio,
  Clock,
  Scissors,
  Settings2,
  AlertCircle,
  RefreshCw,
  Info,
  Clipboard,
  Sparkles,
  Music,
  Video
} from './components/Icons';
import StatusCard from './components/StatusCard';
import HistoryPanel from './components/HistoryPanel';
import { api } from './services/api';
import { ExtractionRequest, JobStatusResponse, VideoInfo, OutputFormat, HistoryItem } from './types';
import { YOUTUBE_REGEX } from './constants';

const App: React.FC = () => {
  // Form State
  const [url, setUrl] = useState('');
  const [startTime, setStartTime] = useState('0:00');
  const [endTime, setEndTime] = useState('');
  const [extractFull, setExtractFull] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [filename, setFilename] = useState('');
  const [topic, setTopic] = useState('');
  const [preacher, setPreacher] = useState('');

  // App Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  
  // Job State
  const [currentJob, setCurrentJob] = useState<JobStatusResponse | null>(null);
  const [jobStartTime, setJobStartTime] = useState<number | null>(null);
  const pollInterval = useRef<number | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [durationDisplay, setDurationDisplay] = useState<string | null>(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('extraction_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    const updated = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    localStorage.setItem('extraction_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (confirm('Clear all history?')) {
      setHistory([]);
      localStorage.removeItem('extraction_history');
    }
  };

  // Duration Calculator
  useEffect(() => {
    if (extractFull) {
      if (videoInfo) {
        setDurationDisplay(formatDuration(videoInfo.duration));
      } else {
        setDurationDisplay(null);
      }
      return;
    }

    if (!startTime || !endTime) {
      setDurationDisplay(null);
      return;
    }

    const parseSeconds = (t: string) => {
      const p = t.split(':').map(Number);
      if (p.some(isNaN)) return 0;
      if (p.length === 1) return p[0];
      if (p.length === 2) return p[0] * 60 + p[1];
      if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
      return 0;
    };

    const s = parseSeconds(startTime);
    const e = parseSeconds(endTime);

    if (e > s) {
      setDurationDisplay(formatDuration(e - s));
    } else {
      setDurationDisplay(null);
    }
  }, [startTime, endTime, extractFull, videoInfo]);

  // Video Info Fetching
  useEffect(() => {
    const fetchInfo = async () => {
      if (!url || !YOUTUBE_REGEX.test(url)) {
        setVideoInfo(null);
        return;
      }

      setIsFetchingInfo(true);
      setError(null);
      try {
        const info = await api.getVideoInfo(url);
        setVideoInfo(info);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingInfo(false);
      }
    };

    const timeoutId = setTimeout(fetchInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!YOUTUBE_REGEX.test(url)) {
      setError('Please enter a valid YouTube URL.');
      return false;
    }

    if (extractFull) {
      if (videoInfo && videoInfo.duration > 14400) {
         setError('Full extraction is limited to videos under 4 hours.');
         return false;
      }
    } else {
      if (!startTime) {
        setError('Start time is required.');
        return false;
      }
      if (!endTime) {
        setError('End time is required.');
        return false;
      }
      
      const parseSeconds = (t: string) => {
         const p = t.split(':').map(Number);
         if (p.length === 1) return p[0];
         if (p.length === 2) return p[0] * 60 + p[1];
         if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
         return 0;
      };

      const s = parseSeconds(startTime);
      const e = parseSeconds(endTime);

      if (e <= s) {
        setError('End time must be after start time.');
        return false;
      }
      if (e - s > 14400) {
        setError('Snippet cannot exceed 4 hours.');
        return false;
      }
      if (videoInfo && e > videoInfo.duration) {
        setError(`End time exceeds video duration (${formatDuration(videoInfo.duration)})`);
        return false;
      }
    }

    return true;
  };

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setCurrentJob(null);
    setJobStartTime(Date.now());

    const request: ExtractionRequest = {
      url,
      start_time: extractFull ? null : startTime,
      end_time: extractFull ? null : endTime,
      extract_full: extractFull,
      output_format: outputFormat,
      filename: filename || undefined,
      topic: topic || undefined,
      preacher: preacher || undefined
    };

    try {
      const job = await api.createExtractionJob(request);
      setCurrentJob(job);
      startPolling(job.job_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start extraction');
      setLoading(false);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    
    pollInterval.current = window.setInterval(async () => {
      try {
        const status = await api.getJobStatus(jobId);
        setCurrentJob(status);

        if (status.status === 'completed') {
          stopPolling();
          setLoading(false);
          if (videoInfo) {
            saveHistory({
              id: status.job_id,
              title: videoInfo.title,
              format: outputFormat,
              filename: filename,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          stopPolling();
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error', err);
        stopPolling();
        setLoading(false);
        setError('Lost connection to server. Please check your internet.');
      }
    }, 2000);
  };

  const handleCancel = async () => {
    if (currentJob && (currentJob.status === 'processing' || currentJob.status === 'created')) {
      try {
        await api.cancelJob(currentJob.job_id);
        setCurrentJob({ ...currentJob, status: 'cancelled' });
      } catch (e) {
        console.error(e);
      } finally {
        stopPolling();
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    setUrl('');
    setVideoInfo(null);
    setStartTime('0:00');
    setEndTime('');
    setFilename('');
    setTopic('');
    setPreacher('');
    setError(null);
    setCurrentJob(null);
    setLoading(false);
    stopPolling();
  };

  const getThumbnail = () => {
    if (videoInfo?.thumbnail) return videoInfo.thumbnail;
    const videoId = url.match(/v=([a-zA-Z0-9_-]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const thumbnail = getThumbnail();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-600 selection:text-white pb-20">
      
      {/* Container */}
      <div className="max-w-5xl mx-auto px-6 pt-12 md:pt-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
            <div className="flex flex-col items-start">
                <div className="mb-4">
                  <div className="bg-white/90 p-2 rounded-xl inline-block">
                    <img 
                      src="https://livingseed.org/wp-content/uploads/2023/05/LSeed-Logo-1.png" 
                      alt="Livingseed Logo" 
                      className="h-10 w-auto object-contain" 
                    />
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                   Livingseed <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Media Cut</span>
                </h1>
                <p className="text-zinc-400 font-medium text-lg max-w-xl">
                    The official tool to extract audio from our ministry videos.
                </p>
            </div>
            {/* Top Right Actions */}
            <div className="flex gap-3 self-start md:self-center">
                <button 
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-all text-sm font-bold text-zinc-200"
                >
                    <RefreshCw size={18} /> History
                </button>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#121212] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-slide-up relative">
            
            {/* Processing Bar (Top Border) */}
            {loading && <div className="absolute top-0 left-0 h-1 w-full bg-indigo-600 animate-pulse z-10"></div>}

            <div className="p-8 md:p-12">
                <form onSubmit={handleExtract} className="space-y-12">
                    
                    {/* SECTION 1: Source */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Source URL</label>
                            {url && (
                                <button type="button" onClick={handleClear} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wide transition-colors">
                                    Clear Form
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Youtube className={`w-6 h-6 transition-colors ${url ? 'text-red-500' : 'text-zinc-600'}`} />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-black border-2 border-zinc-800 text-white rounded-2xl py-5 pl-14 pr-32 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-900/20 outline-none transition-all placeholder:text-zinc-700 text-xl font-medium"
                                placeholder="Paste YouTube link here..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                                {isFetchingInfo ? (
                                    <div className="px-4 py-2">
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    !url && (
                                        <button 
                                            type="button" 
                                            onClick={handlePaste}
                                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm font-bold transition-all border border-zinc-800"
                                        >
                                            <span className="flex items-center gap-2"><Clipboard size={14} /> Paste</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Video Preview Panel */}
                        {videoInfo && (
                            <div className="mt-6 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 flex flex-col md:flex-row gap-6 animate-fade-in hover:bg-zinc-900 transition-colors group">
                                {thumbnail && (
                                    <div className="w-full md:w-56 aspect-video rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-black relative">
                                        <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm text-white text-xs font-bold rounded">
                                            {formatDuration(videoInfo.duration)}
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 py-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="font-bold text-white text-xl leading-tight" title={videoInfo.title}>{videoInfo.title}</h3>
                                    </div>
                                    <p className="text-zinc-500 text-sm mt-3 font-medium flex items-center gap-2">
                                        By <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">{videoInfo.uploader}</span>
                                    </p>
                                    <div className="mt-5 flex gap-2">
                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50 flex items-center gap-1.5">
                                            <CheckCircle size={12} /> Video Found
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-px bg-zinc-800"></div>

                    {/* SECTION 2: Configuration */}
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings2 className="text-indigo-500" /> 
                                Extraction Settings
                            </h2>
                            
                            {/* Mode Switcher */}
                            <div className="bg-black p-1.5 rounded-xl border border-zinc-800 flex shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setExtractFull(false)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!extractFull ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Scissors size={14} /> Snippet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExtractFull(true)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${extractFull ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <FileAudio size={14} /> Full Track
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Start Time */}
                            <div className={`md:col-span-4 space-y-3 ${extractFull ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Start Time</label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        disabled={extractFull}
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-black border-2 border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-900/10 outline-none font-mono text-lg font-medium transition-all"
                                        placeholder="0:00"
                                    />
                                </div>
                            </div>

                            {/* End Time */}
                            <div className={`md:col-span-4 space-y-3 ${extractFull ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">End Time</label>
                                    {durationDisplay && !extractFull && (
                                        <span className="text-xs font-bold text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-900/50 animate-fade-in">
                                            {durationDisplay}
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        disabled={extractFull}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-black border-2 border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-900/10 outline-none font-mono text-lg font-medium transition-all"
                                        placeholder="e.g. 1:30"
                                    />
                                </div>
                            </div>

                            {/* Format */}
                            <div className="md:col-span-4 space-y-3">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Output Format</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-4 w-5 h-5 text-zinc-600 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                                        {outputFormat === 'mp4' ? <Video size={20} /> : <Music size={20} />}
                                    </div>
                                    <select
                                        value={outputFormat}
                                        onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                        className="w-full bg-black border-2 border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-900/10 outline-none appearance-none cursor-pointer text-lg font-medium transition-all"
                                    >
                                        <option value="mp3">MP3 (Audio)</option>
                                        <option value="wav">WAV (High Quality)</option>
                                        <option value="mp4">MP4 (Video)</option>
                                    </select>
                                    <div className="absolute right-4 top-5 pointer-events-none">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Details Toggle */}
                        <div className="pt-2">
                            <details className="group border border-zinc-800 rounded-2xl bg-zinc-900/30 open:bg-zinc-900 transition-all duration-300 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-200">
                                        <Info size={18} />
                                        <span className="text-sm font-bold">Metadata & Filename Options</span>
                                    </div>
                                    <span className="text-zinc-500 transition-transform group-open:rotate-180">
                                        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </span>
                                </summary>
                                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in border-t border-zinc-800/50 mt-2">
                                    <div className="space-y-2 mt-4">
                                        <label className="text-xs font-bold text-zinc-500">Custom Filename</label>
                                        <input
                                            type="text"
                                            value={filename}
                                            onChange={(e) => setFilename(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="my-awesome-clip"
                                        />
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <label className="text-xs font-bold text-zinc-500">Topic / Album</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="Conference 2024"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-zinc-500">Artist / Speaker</label>
                                        <input
                                            type="text"
                                            value={preacher}
                                            onChange={(e) => setPreacher(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-4">
                        {error && (
                            <div className="mb-6 bg-red-950/20 border border-red-900/50 text-red-200 px-5 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
                                <AlertCircle className="shrink-0 text-red-500" />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !url}
                            className={`w-full py-5 rounded-2xl font-bold text-lg uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-3 transform ${
                                loading 
                                ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800' 
                                : !url 
                                    ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800 opacity-60'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Processing Request...
                                </>
                            ) : (
                                <>
                                    <Download size={24} />
                                    Start Extraction
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Job Status */}
                {currentJob && (
                    <StatusCard 
                        status={currentJob} 
                        onCancel={handleCancel} 
                        startTime={jobStartTime}
                    />
                )}

                {/* Completion Card */}
                {currentJob?.status === 'completed' && (
                    <div className="mt-8 p-8 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl text-center animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-5 relative z-10" />
                        <h3 className="text-3xl font-extrabold text-white mb-2 relative z-10">Extraction Complete!</h3>
                        <p className="text-emerald-400 mb-8 font-medium relative z-10">Your file has been processed successfully.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <button
                                onClick={() => window.open(api.getDownloadUrl(currentJob.job_id), '_blank')}
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 min-w-[200px]"
                            >
                                <Download size={20} /> Download Now
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-10 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-800 transition-colors"
                            >
                                New Extraction
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 mb-8 text-zinc-600 text-sm">
           <p className="flex items-center justify-center gap-2 font-medium">
             Built by Livingseed Media Team
           </p>
        </div>

        {/* History Drawer */}
        <HistoryPanel 
            history={history} 
            isOpen={showHistory} 
            onClose={() => setShowHistory(false)}
            onClear={clearHistory}
        />
        
      </div>
    </div>
  );
};

export default App;