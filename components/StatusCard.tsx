import React, { useEffect, useState } from 'react';
import { JobStatusResponse } from '../types';
import { PACIFYING_MESSAGES, CELEBRATION_MESSAGES } from '../constants';
import { Loader2, CheckCircle, AlertCircle, X } from './Icons';

interface StatusCardProps {
  status: JobStatusResponse;
  onCancel: () => void;
  startTime: number | null;
}

const StatusCard: React.FC<StatusCardProps> = ({ status, onCancel, startTime }) => {
  const [pacifyingMsg, setPacifyingMsg] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  useEffect(() => {
    // Set random pacifying message based on status category
    let category = 'processing';
    if (status.status === 'created') category = 'created';
    if (status.status === 'completed') category = 'completed';
    if (status.status === 'failed') category = 'failed';
    
    // Map internal progress strings to categories if status is processing
    if (status.status === 'processing' && status.progress) {
       if (status.progress.toLowerCase().includes('download')) category = 'downloading';
       if (status.progress.toLowerCase().includes('trim')) category = 'trimming';
    }

    // @ts-ignore
    const messages = PACIFYING_MESSAGES[category] || PACIFYING_MESSAGES.processing;
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setPacifyingMsg(randomMsg);

  }, [status.status, status.progress]);

  useEffect(() => {
    if (status.status === 'processing' && status.percent && status.percent > 5 && startTime) {
      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;
      const estimatedTotalSeconds = (elapsedSeconds / status.percent) * 100;
      const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;

      if (remainingSeconds < 60) {
        setEstimatedTime(`~${Math.ceil(remainingSeconds)}s remaining`);
      } else {
        const minutes = Math.ceil(remainingSeconds / 60);
        setEstimatedTime(`~${minutes} min remaining`);
      }
    } else {
      setEstimatedTime(null);
    }
  }, [status.percent, startTime, status.status]);

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed': return 'border-emerald-600 bg-emerald-950/30';
      case 'failed': return 'border-red-600 bg-red-950/30';
      case 'cancelled': return 'border-zinc-600 bg-zinc-900';
      default: return 'border-amber-500 bg-amber-950/30';
    }
  };

  const getBadgeColor = () => {
    switch (status.status) {
      case 'completed': return 'bg-emerald-600 text-white';
      case 'failed': return 'bg-red-600 text-white';
      case 'cancelled': return 'bg-zinc-600 text-white';
      default: return 'bg-amber-500 text-black';
    }
  };

  return (
    <div className={`mt-8 p-6 rounded-xl border-l-4 shadow-lg animate-slide-up ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getBadgeColor()}`}>
            {status.status}
          </span>
          <span className="font-bold text-white capitalize text-lg">
            {status.status === 'processing' ? 'Processing...' : status.status}
          </span>
        </div>
        {(status.status === 'processing' || status.status === 'created') && (
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-red-400 transition-colors bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 hover:border-red-500/30"
          >
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      <div className="w-full bg-black/40 rounded-full h-3 mb-4 overflow-hidden border border-white/5">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            status.status === 'failed' ? 'bg-red-600' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          style={{ width: `${status.percent || (status.status === 'completed' ? 100 : 5)}%` }}
        ></div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm font-bold text-zinc-300">
          <span>{status.progress || 'Initializing...'} {status.percent ? `(${status.percent.toFixed(1)}%)` : ''}</span>
          {estimatedTime && <span className="text-indigo-400">{estimatedTime}</span>}
        </div>
        <div className="text-xs text-zinc-500 italic flex items-center gap-2 pt-1">
           {status.status === 'processing' && <Loader2 size={12} className="animate-spin text-indigo-500" />}
           {status.status === 'completed' ? CELEBRATION_MESSAGES[0] : pacifyingMsg}
        </div>
      </div>

      {status.error && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-200 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          <span>{status.error}</span>
        </div>
      )}
    </div>
  );
};

export default StatusCard;