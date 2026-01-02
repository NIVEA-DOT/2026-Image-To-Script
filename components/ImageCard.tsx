
import React from 'react';
import { GeneratedMedia } from '../types';
import Button from './Button';

interface MediaCardProps {
  media: GeneratedMedia;
  onDownload: (mediaUrl: string, fileName: string) => void;
  onRegenerate: (index: number) => void;
  onGenerateVideo: (index: number) => void;
  onGenerateTTS: (index: number) => void;
  onUpscale: (index: number) => void;
  isDisabled: boolean;
}

// Icons
const RefreshIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const MagicIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const VideoIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const AudioIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SparklesIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

const MediaCard: React.FC<MediaCardProps> = ({ media, onDownload, onRegenerate, onGenerateVideo, onGenerateTTS, onUpscale, isDisabled }) => {

  const handleDownloadClick = () => onDownload(media.mediaUrl, `image-${media.index}.png`);
  const handleDownloadVideoClick = () => media.videoUrl && onDownload(media.videoUrl, `video-${media.index}.mp4`);
  const handleDownloadAudioClick = () => media.audioUrl && onDownload(media.audioUrl, `audio-${media.index}.mp3`);

  const isAnyProcessing = media.isProcessing || media.isVideoProcessing || media.isAudioProcessing || media.isUpscaling || isDisabled;

  return (
    <div 
      className={`group bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-xl hover:border-blue-100 transition-all duration-300 ${isAnyProcessing ? 'opacity-90' : ''}`} 
      id={`media-card-${media.index}`}
    >
      {/* 1. Visual Area (Thumbnail) */}
      <div className="md:w-72 relative aspect-video bg-[#f9fafb] flex-shrink-0 border-r border-gray-50 overflow-hidden">
        {media.mediaUrl ? (
          <img
            src={media.mediaUrl}
            alt={media.prompt}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <span className="text-4xl opacity-50">🖼️</span>
          </div>
        )}
        
        {/* Processing Overlay */}
        {(media.isProcessing || media.isVideoProcessing || media.isAudioProcessing || media.isUpscaling) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-10 text-white">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold tracking-wider uppercase">
               {media.isProcessing ? 'Generating Image...' : media.isUpscaling ? 'Upscaling to 4K...' : media.isVideoProcessing ? 'Rendering Video...' : 'Synthesizing Audio...'}
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
           <div className="bg-black/70 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
               SCENE {media.index}
           </div>
           {media.isIntro && (
             <div className="bg-rose-500/90 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide">
                 INTRO
             </div>
           )}
        </div>
      </div>
      
      {/* 2. Content Area */}
      <div className="flex-grow p-6 flex flex-col justify-between min-w-0">
        <div>
          <h4 className="text-[#191f28] font-bold text-lg mb-2 leading-snug">
            {media.originalScriptSegment || <span className="text-gray-300 italic">No script content</span>}
          </h4>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
             <p className="text-[11px] text-gray-400 font-mono leading-relaxed line-clamp-2">
               Prompt: {media.prompt}
             </p>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="p-4 bg-white flex md:flex-col items-center justify-center gap-3 border-l border-gray-50">
         
         {/* Generate/Regenerate */}
         <Button
            onClick={() => onRegenerate(media.index)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 ${!media.mediaUrl ? 'bg-[#3182f6] text-white animate-pulse' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-[#3182f6]'}`}
            disabled={isAnyProcessing}
            title={media.mediaUrl ? "Regenerate Image" : "Generate Image"}
            icon={media.mediaUrl ? <RefreshIcon /> : <MagicIcon />}
         />

         {/* 4K Upscale */}
         <Button
            onClick={() => onUpscale(media.index)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 ${media.isUpscaling ? 'bg-purple-50 text-purple-600' : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}
            disabled={isAnyProcessing || !media.mediaUrl}
            title="Upscale to 4K"
         >
           <div className="flex flex-col items-center justify-center leading-none">
             <span className="text-[10px] font-black">4K</span>
           </div>
         </Button>

         {/* Video */}
         <Button
            onClick={media.videoUrl ? handleDownloadVideoClick : () => onGenerateVideo(media.index)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 ${media.videoUrl ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
            disabled={isAnyProcessing || !media.mediaUrl}
            title={media.videoUrl ? "Download Video" : "Generate Video"}
            icon={media.videoUrl ? <DownloadIcon /> : <VideoIcon />}
         />

         {/* Audio */}
         <Button
            onClick={media.audioUrl ? handleDownloadAudioClick : () => onGenerateTTS(media.index)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 ${media.audioUrl ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
            disabled={isAnyProcessing}
            title={media.audioUrl ? "Download Audio" : "Generate TTS"}
            icon={media.audioUrl ? <DownloadIcon /> : <AudioIcon />}
         />

         {/* Image Download */}
         <Button
            onClick={handleDownloadClick}
            className="w-11 h-11 rounded-2xl bg-white text-gray-400 hover:text-gray-900 flex items-center justify-center border border-gray-100 shadow-sm hover:bg-gray-50"
            disabled={!media.mediaUrl}
            title="Download Image"
            icon={<DownloadIcon />}
         />

      </div>
    </div>
  );
};

export default MediaCard;
