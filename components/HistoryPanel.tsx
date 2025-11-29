import React, { useEffect } from 'react';
import { HistoryItem } from '../types';
import { FileAudio, FileVideo, Download, X, Clock, Trash2 } from './Icons';
import { api } from '../services/api';

interface HistoryPanelProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, isOpen, onClose, onClear }) => {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownload = (id: string) => {
    window.open(api.getDownloadUrl(id), '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0a0a0a] border-l border-zinc-800 shadow-2xl transform transition-transform animate-slide-in-right flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-[#121212]">
          <div>
            <h2 className="text-xl font-bold text-white">History</h2>
            <p className="text-zinc-500 text-sm">Your recent extractions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 opacity-60">
              <Clock size={48} className="mb-4" />
              <p className="text-lg font-medium">No history yet</p>
              <p className="text-sm">Extracted clips will appear here</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-relaxed" title={item.title}>
                      {item.title}
                    </h3>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                    {item.format === 'mp4' ? <FileVideo size={10} /> : <FileAudio size={10} />}
                    {item.format}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-zinc-500 font-mono">
                    {item.timestamp}
                  </div>
                  <button 
                    onClick={() => handleDownload(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/20"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-zinc-800 bg-[#121212]">
            <button 
              onClick={onClear}
              className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:bg-red-950/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

export default HistoryPanel;