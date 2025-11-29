export const API_BASE = 'https://livingseed-cut.onrender.com';

export const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/|m\.youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=)[a-zA-Z0-9_-]{11}([?&].*)?$/;

export const PACIFYING_MESSAGES = {
  created: [
    '🎵 Preparing to extract your audio snippet...',
    '🚀 Getting ready to process your request...',
    '⚡ Initializing audio extraction...'
  ],
  processing: [
    '🎬 Fetching video information...',
    '📡 Connecting to YouTube servers...',
    '🔍 Analyzing video content...'
  ],
  downloading: [
    '⬇️ Downloading audio stream...',
    '🌐 Fetching audio data from YouTube...',
    '📥 Retrieving audio content...'
  ],
  trimming: [
    '✂️ Trimming audio to your specified range...',
    '🎚️ Processing audio snippet...',
    '🔧 Finalizing your audio clip...'
  ],
  completed: [
    '✅ Your audio snippet is ready!',
    '🎉 Extraction completed successfully!',
    '✨ Your audio file is prepared!'
  ],
  failed: [
    '❌ Something went wrong...',
    '😔 Extraction failed, please try again',
    '⚠️ Unable to process this request'
  ]
};

export const CELEBRATION_MESSAGES = [
  '🎉 Your audio snippet is ready!',
  '✨ Extraction completed successfully!',
  '🎵 Your audio file is prepared!',
  '🚀 Ready for download!',
  '💫 Audio processing finished!'
];