
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  onGenerateText: (script: string) => Promise<{ topText: string; bottomText: string }>;
}

const ThumbnailModal: React.FC<ThumbnailModalProps> = ({ isOpen, onClose, script, onGenerateText }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('상단 어그로 문구');
  const [bottomText, setBottomText] = useState('하단 강조 문구');
  const [textColor, setTextColor] = useState('#ffff00'); // 노란색
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && bgImage) {
      drawThumbnail();
    }
  }, [isOpen, bgImage, topText, bottomText, textColor]);

  const loadFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { alert('2MB 이하만 가능합니다.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setBgImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const drawThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1280, 720);
      
      // 하단 그라데이션 (가독성)
      const grad = ctx.createLinearGradient(0, 350, 0, 720);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 350, 1280, 370);

      const drawStrokeText = (text: string, x: number, y: number, color: string, size: number) => {
        ctx.font = `900 ${size}px "Pretendard", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        // 두꺼운 외곽선
        ctx.lineJoin = 'round';
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(text, x, y);
        
        // 부드러운 그림자
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        // 그림자 초기화
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      };

      drawStrokeText(topText, 60, 560, '#ffffff', 105);
      drawStrokeText(bottomText, 60, 680, textColor, 125);
    };
    img.src = bgImage!;
  };

  const handleAiText = async () => {
    if (!script) return;
    setIsLoading(true);
    try {
      const texts = await onGenerateText(script);
      setTopText(texts.topText);
      setBottomText(texts.bottomText);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130] flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden toss-shadow animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b flex justify-between items-center bg-white">
          <h2 className="text-3xl font-black text-[#191f28]">AI 썸네일 메이커</h2>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full text-2xl">✕</button>
        </div>
        
        <div className="flex flex-col lg:flex-row p-10 gap-10 overflow-y-auto max-h-[80vh]">
          <div className="flex-grow space-y-6">
            {!bgImage ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video bg-[#f9fafb] border-4 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-[#3182f6] transition-all group"
              >
                <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">🖼️</span>
                <p className="text-xl font-bold text-[#4e5968]">이미지를 드래그하거나 클릭하세요</p>
                <p className="text-[#8b95a1] mt-2">유튜브 표준 (1280x720, 2MB 이하)</p>
                <input type="file" ref={fileInputRef} onChange={(e) => loadFile(e.target.files![0])} className="hidden" accept="image/*" />
              </div>
            ) : (
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden toss-shadow border border-gray-100">
                <canvas ref={canvasRef} width={1280} height={720} className="w-full h-auto" />
                <button onClick={() => setBgImage(null)} className="absolute top-6 right-6 bg-black/60 text-white px-6 py-2 rounded-full font-bold hover:bg-black backdrop-blur-md">배경 변경</button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-96 space-y-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-[#8b95a1] uppercase tracking-widest">Text Editor</h3>
              <input value={topText} onChange={(e) => setTopText(e.target.value)} className="w-full p-5 bg-[#f9fafb] rounded-2xl border-none font-bold text-lg outline-none focus:ring-4 focus:ring-blue-50" placeholder="1행 (화이트)" />
              <input value={bottomText} onChange={(e) => setBottomText(e.target.value)} className="w-full p-5 bg-[#f9fafb] rounded-2xl border-none font-bold text-lg outline-none focus:ring-4 focus:ring-blue-50" placeholder="2행 (강조색)" />
              
              <div className="flex gap-4">
                {['#ffff00', '#ffffff', '#ff4d4d', '#00ff7f'].map(c => (
                  <button key={c} onClick={() => setTextColor(c)} className={`w-12 h-12 rounded-full border-4 transition-all ${textColor === c ? 'border-[#3182f6] scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                ))}
              </div>

              <Button onClick={handleAiText} fullWidth variant="secondary" className="bg-[#e8f3ff] text-[#3182f6] h-14 font-black rounded-2xl border-none" disabled={isLoading}>
                {isLoading ? '대본 분석 중...' : 'AI 어그로 문구 추출'}
              </Button>
            </div>

            <div className="pt-10 border-t">
              <Button onClick={() => {
                const link = document.createElement('a');
                link.download = `YouTube_Thumbnail_${Date.now()}.png`;
                link.href = canvasRef.current!.toDataURL('image/png');
                link.click();
              }} fullWidth className="h-20 bg-[#191f28] text-white text-xl font-black rounded-[1.5rem] border-none shadow-xl shadow-gray-200" disabled={!bgImage}>
                썸네일 저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailModal;
