
import React from 'react';
import Button from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevenLabsKey: string;
  setElevenLabsKey: (key: string) => void;
  elevenLabsVoiceId: string;
  setElevenLabsVoiceId: (id: string) => void;
  falAiKey?: string;
  setFalAiKey?: (key: string) => void;
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  elevenLabsKey, 
  setElevenLabsKey, 
  elevenLabsVoiceId, 
  setElevenLabsVoiceId,
  falAiKey = '',
  setFalAiKey,
  googleApiKey,
  setGoogleApiKey
}) => {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 toss-shadow">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold text-[#191f28]">AI 서비스 설정</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh]">
          {/* Gemini Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#3182f6] rounded-full"></div>
              <h3 className="text-lg font-bold text-[#191f28]">Visual AI (Gemini)</h3>
            </div>
            <div className="p-6 bg-[#f9fafb] rounded-[1.5rem] border border-gray-100">
               <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={googleApiKey} 
                  onChange={(e) => setGoogleApiKey(e.target.value)} 
                  className="w-full p-4 bg-white border border-gray-200 focus:border-[#3182f6] rounded-xl text-sm transition-all outline-none font-medium" 
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-gray-400 ml-1">
                  이미지 및 비디오 생성을 위해 필요합니다. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-[#3182f6] font-bold">키 발급받기</a>
                </p>
              </div>
            </div>
          </section>

          {/* Upscaling Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#8b5cf6] rounded-full"></div>
              <h3 className="text-lg font-bold text-[#191f28]">4K Upscale (Fal.ai)</h3>
            </div>
            <div className="p-6 bg-[#f9fafb] rounded-[1.5rem] border border-gray-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">Fal.ai API Key</label>
                <input 
                  type="password" 
                  value={falAiKey} 
                  onChange={(e) => setFalAiKey && setFalAiKey(e.target.value)} 
                  className="w-full p-4 bg-white border border-gray-200 focus:border-[#8b5cf6] rounded-xl text-sm transition-all outline-none font-medium" 
                  placeholder="key-..."
                />
                <p className="text-xs text-gray-400 ml-1">초고화질 업스케일링을 위해 필요합니다.</p>
              </div>
            </div>
          </section>

          {/* ElevenLabs Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#10b981] rounded-full"></div>
              <h3 className="text-lg font-bold text-[#191f28]">Voice AI (ElevenLabs)</h3>
            </div>
            <div className="space-y-6 p-6 bg-[#f9fafb] rounded-[1.5rem] border border-gray-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">ElevenLabs API Key</label>
                <input 
                  type="password" 
                  value={elevenLabsKey} 
                  onChange={(e) => setElevenLabsKey(e.target.value)} 
                  className="w-full p-4 bg-white border border-gray-200 focus:border-[#10b981] rounded-xl text-sm transition-all outline-none font-medium" 
                  placeholder="sk_..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#8b95a1] ml-1 uppercase tracking-wider">Voice ID (Adam 권장)</label>
                <input 
                  type="text" 
                  value={elevenLabsVoiceId} 
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)} 
                  className="w-full p-4 bg-white border border-gray-200 focus:border-[#10b981] rounded-xl text-sm transition-all outline-none font-medium" 
                  placeholder="Adam (nPczCjzI2devNBz1zWbc)"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-[#f9fafb] flex justify-end gap-3 border-t border-gray-100">
          <Button onClick={onClose} variant="primary" className="px-10 h-16 bg-[#191f28] rounded-2xl text-lg font-bold shadow-lg border-none">
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
