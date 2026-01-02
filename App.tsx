
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeSegmentsForPrompts, generateImage, refineScript, generateVideoFromImage, generateThumbnailText } from './services/geminiService';
import { generateTTS } from './services/elevenLabsService';
import { upscaleImage } from './services/falAiService';
import { saveProject, getProjects, deleteProject } from './services/storageService';
import { GeneratedMedia, SavedProject } from './types';
import { DEFAULT_ASPECT_RATIO, DEFAULT_ART_STYLE } from './constants';
import Button from './components/Button';
import MediaCard from './components/ImageCard';
import HistoryModal from './components/HistoryModal';
import ApiKeyModal from './components/ApiKeyModal';
import ThumbnailModal from './components/ThumbnailModal';
import AuthPage from './components/AuthPage';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Step State: 1 = Input, 2 = Plan/Review, 3 = Production
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Step 1: Input
  const [introScript, setIntroScript] = useState<string>('');
  const [bodyScript, setBodyScript] = useState<string>('');

  // Step 2 & 3 Data
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  
  // Settings & Keys
  const [googleApiKey, setGoogleApiKey] = useState<string>(localStorage.getItem('google_api_key') || '');
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(localStorage.getItem('elevenlabs_key') || '');
  const [voiceId, setVoiceId] = useState<string>(localStorage.getItem('elevenlabs_voice_id') || 'nPczCjzI2devNBz1zWbc');
  const [falAiKey, setFalAiKey] = useState<string>(localStorage.getItem('falai_key') || '');

  // Loading States
  const [loadingType, setLoadingType] = useState<'none' | 'planning' | 'image' | 'video' | 'audio' | 'zip' | 'upscale' | 'single_image'>('none');
  const [progress, setProgress] = useState<number>(0); 
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null); 

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showThumbnailModal, setShowThumbnailModal] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyProjects, setHistoryProjects] = useState<SavedProject[]>([]);

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('google_api_key', googleApiKey);
    localStorage.setItem('elevenlabs_key', elevenLabsKey);
    localStorage.setItem('elevenlabs_voice_id', voiceId);
    localStorage.setItem('falai_key', falAiKey);
  }, [googleApiKey, elevenLabsKey, voiceId, falAiKey]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // --- Logic: Semantic Sentence Splitter ---
  const splitAndGroupSentences = (text: string, maxGroupSize: number): string[] => {
    if (!text) return [];
    
    // 1. Split by paragraphs (double newlines or single newlines depending on format)
    // using newlines as a strong signal for "Meaning Unit" separation.
    const paragraphs = text.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);
    
    const finalSegments: string[] = [];

    paragraphs.forEach(paragraph => {
        // 2. Split paragraph into sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [paragraph];
        const cleanedSentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
        
        // 3. Group sentences within this paragraph
        let currentGroup: string[] = [];
        cleanedSentences.forEach(sentence => {
            currentGroup.push(sentence);
            if (currentGroup.length >= maxGroupSize) {
                finalSegments.push(currentGroup.join(' '));
                currentGroup = [];
            }
        });
        // Add remaining sentences in this paragraph as a group
        if (currentGroup.length > 0) {
            finalSegments.push(currentGroup.join(' '));
        }
    });

    return finalSegments;
  };

  // --- Step 1 -> Step 2: Analyze & Plan ---
  const handleAnalyzeAndPlan = async () => {
    if (!introScript.trim() && !bodyScript.trim()) {
      setError("대본을 입력해주세요.");
      return;
    }

    if (!googleApiKey) {
      setError("Google Gemini API 키가 설정되지 않았습니다. 설정 메뉴에서 키를 입력해주세요.");
      setShowSettings(true);
      return;
    }

    setLoadingType('planning');
    setError(null);
    setProgress(0);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Segmentation Strategy
      // Intro: High detail (2 sentences max per scene)
      // Body: 3-4 sentences per scene (Semantic grouping)
      const introSegments = splitAndGroupSentences(introScript, 2);
      const bodySegments = splitAndGroupSentences(bodyScript, 4); // Target 4 max, usually results in 3-4
      const allSegments = [...introSegments, ...bodySegments];
      
      const introCount = introSegments.length;

      setLoadingStatus(`총 ${allSegments.length}개 장면으로 분석 및 프롬프트 생성 중...`);

      // 2. Call Gemini for Prompts
      const sceneData = await analyzeSegmentsForPrompts(allSegments, (msg) => setLoadingStatus(msg));

      // 3. Create Placeholder Media Objects (No images yet)
      const plannedMedia: GeneratedMedia[] = sceneData.map((data, index) => ({
        originalScriptSegment: data.scriptSegment,
        prompt: data.imagePrompt,
        videoMotionPrompt: data.videoMotionPrompt,
        mediaUrl: "", // Empty initially
        index: index + 1,
        isProcessing: false,
        isUpscaling: false,
        isIntro: index < introCount // Mark intro segments
      }));

      setGeneratedMedia(plannedMedia);
      setCurrentStep(2); // Move to Step 2
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingType('none');
    }
  };

  // --- Step 2 -> Step 3: Confirm ---
  const handleConfirmPlan = () => {
    setCurrentStep(3);
  };

  // --- Step 3: Production (Image Generation) ---
  const handleGenerateSingleImage = async (index: number) => {
    setLoadingType('single_image'); // Use specific type to differentiate form batch
    setLoadingStatus(`장면 ${index} 이미지를 생성하고 있습니다...`);
    setProgress(0); // Reset progress to avoid "10/10" confusion
    setError(null);
    try {
      setGeneratedMedia(prev => prev.map(p => p.index === index ? { ...p, isProcessing: true } : p));
      const item = generatedMedia.find(p => p.index === index);
      if (!item) return;

      const url = await generateImage(item.prompt);
      setGeneratedMedia(prev => prev.map(p => p.index === index ? { 
        ...p, 
        mediaUrl: url, 
        isProcessing: false 
      } : p));
      
      // Save state
      saveProject({
        id: Date.now().toString(),
        timestamp: Date.now(),
        script: introScript + "\n\n" + bodyScript,
        media: generatedMedia, 
        aspectRatio: DEFAULT_ASPECT_RATIO,
        artStyle: DEFAULT_ART_STYLE,
        falAiKey: falAiKey
      });

    } catch(e:any) {
       setError(e.message);
       setGeneratedMedia(prev => prev.map(p => p.index === index ? { ...p, isProcessing: false } : p));
    } finally {
       setLoadingType('none');
    }
  };

  const handleStartProduction = async () => {
    setLoadingType('image');
    setError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Find items that don't have images yet
      const pendingItems = generatedMedia.filter(m => !m.mediaUrl);
      let completedCount = generatedMedia.length - pendingItems.length;

      for (const item of pendingItems) {
        if (controller.signal.aborted) break;

        // Update status for specific item
        setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { ...p, isProcessing: true } : p));
        setLoadingStatus(`장면 ${item.index} 이미지 생성 중...`);
        setProgress(Math.round((completedCount / generatedMedia.length) * 100));

        try {
          if (completedCount > 0) await new Promise(r => setTimeout(r, 4000)); // Rate limit buffer

          const url = await generateImage(item.prompt);
          
          setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { 
            ...p, 
            mediaUrl: url, 
            isProcessing: false 
          } : p));

          completedCount++;
        } catch (e) {
          console.error(`Error generating scene ${item.index}`, e);
          setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { ...p, isProcessing: false } : p));
        }
      }

      // Auto save
      if (!controller.signal.aborted) {
        saveProject({
          id: Date.now().toString(),
          timestamp: Date.now(),
          script: introScript + "\n\n" + bodyScript,
          media: generatedMedia, 
          aspectRatio: DEFAULT_ASPECT_RATIO,
          artStyle: DEFAULT_ART_STYLE,
          falAiKey: falAiKey
        });
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingType('none');
    }
  };

  // --- Upscaling Handlers ---
  const handleUpscaleImage = async (index: number) => {
    if (!falAiKey) {
      setError("Fal.ai API 키가 설정되지 않았습니다. 설정 메뉴에서 키를 입력해주세요.");
      setShowSettings(true);
      return;
    }

    const item = generatedMedia.find(m => m.index === index);
    if (!item || !item.mediaUrl) return;

    setLoadingType('single_image');
    setLoadingStatus(`장면 ${index} 4K 변환 중... (최대 2분 소요)`);
    setGeneratedMedia(prev => prev.map(p => p.index === index ? { ...p, isUpscaling: true } : p));

    try {
      const upscaledUrl = await upscaleImage(item.mediaUrl, falAiKey);
      setGeneratedMedia(prev => prev.map(p => p.index === index ? { 
        ...p, 
        mediaUrl: upscaledUrl, // Replace with upscaled image
        isUpscaling: false 
      } : p));
    } catch (e: any) {
      setError(e.message);
      setGeneratedMedia(prev => prev.map(p => p.index === index ? { ...p, isUpscaling: false } : p));
    } finally {
      setLoadingType('none');
    }
  };

  const handleUpscaleAllImages = async () => {
    if (!falAiKey) {
      setError("Fal.ai API 키가 설정되지 않았습니다. 설정 메뉴에서 키를 입력해주세요.");
      setShowSettings(true);
      return;
    }

    setLoadingType('upscale');
    const itemsToUpscale = generatedMedia.filter(m => m.mediaUrl && !m.isUpscaling);
    let count = 0;

    for (const item of itemsToUpscale) {
      setProgress(Math.round((count / itemsToUpscale.length) * 100));
      setLoadingStatus(`Upscaling Scene ${item.index} to 4K...`);
      
      setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { ...p, isUpscaling: true } : p));
      
      try {
        const upscaledUrl = await upscaleImage(item.mediaUrl, falAiKey);
        setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { 
          ...p, 
          mediaUrl: upscaledUrl,
          isUpscaling: false 
        } : p));
      } catch (e: any) {
        console.error(`Failed to upscale scene ${item.index}`, e);
        setGeneratedMedia(prev => prev.map(p => p.index === item.index ? { ...p, isUpscaling: false } : p));
      }
      count++;
    }
    setLoadingType('none');
  };


  // --- Individual Generation Handlers (Video, TTS) ---
  const handleGenerateVideo = async (index: number) => {
    const media = generatedMedia.find(m => m.index === index);
    if (!media || !media.mediaUrl || media.videoUrl) return;
    
    setLoadingType('single_image');
    setLoadingStatus(`장면 ${index} 비디오 생성 중...`);
    
    setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, isVideoProcessing: true } : m));
    try {
      const vUrl = await generateVideoFromImage(media.mediaUrl, media.videoMotionPrompt || "Cinematic pan.");
      setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, videoUrl: vUrl, isVideoProcessing: false } : m));
    } catch (e: any) { 
      setError(e.message); 
      setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, isVideoProcessing: false } : m)); 
    } finally {
      setLoadingType('none');
    }
  };

  const handleGenerateTTS = async (index: number) => {
    const media = generatedMedia.find(m => m.index === index);
    if (!media) return;
    if (!elevenLabsKey) { setError("ElevenLabs API Key를 먼저 설정하세요."); setShowSettings(true); return; }
    
    setLoadingType('single_image');
    setLoadingStatus(`장면 ${index} TTS 생성 중...`);

    setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, isAudioProcessing: true } : m));
    try {
      const aUrl = await generateTTS(media.originalScriptSegment, elevenLabsKey, voiceId);
      setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, audioUrl: aUrl, isAudioProcessing: false } : m));
    } catch (e: any) { 
      setError(e.message); 
      setGeneratedMedia(prev => prev.map(m => m.index === index ? { ...m, isAudioProcessing: false } : m)); 
    } finally {
      setLoadingType('none');
    }
  };

  const handleGenerateAllTTS = async () => {
    if (!elevenLabsKey) { setError("ElevenLabs API Key를 먼저 설정하세요."); setShowSettings(true); return; }
    setLoadingType('audio');
    let count = 0;
    for (const m of generatedMedia) {
      if (m.audioUrl) continue;
      setProgress(Math.round((++count / generatedMedia.length) * 100));
      try {
        const aUrl = await generateTTS(m.originalScriptSegment, elevenLabsKey, voiceId);
        setGeneratedMedia(prev => prev.map(item => item.index === m.index ? { ...item, audioUrl: aUrl } : item));
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) { setError(e.message); break; }
    }
    setLoadingType('none');
  };

  const handleFinalZipDownload = async () => {
    if (generatedMedia.length === 0) return;
    setLoadingType('zip'); setProgress(0);
    try {
      const zip = new JSZip();
      const imageFolder = zip.folder("images");
      const audioFolder = zip.folder("audio");
      for (let i = 0; i < generatedMedia.length; i++) {
        const media = generatedMedia[i]; setProgress(Math.round((i / generatedMedia.length) * 100));
        if (media.mediaUrl) {
          try {
            const imgResponse = await fetch(media.mediaUrl);
            const imgBlob = await imgResponse.blob();
            imageFolder?.file(`scene-${media.index}.png`, imgBlob);
          } catch (e) { console.error(e); }
        }
        if (media.audioUrl) {
          try {
            const audioResponse = await fetch(media.audioUrl);
            const audioBlob = await audioResponse.blob();
            audioFolder?.file(`scene-${media.index}.mp3`, audioBlob);
          } catch (e) { console.error(e); }
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; link.download = `pack_${Date.now()}.zip`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); } finally { setLoadingType('none'); }
  };

  const downloadFileSafe = async (url: string, fileName: string) => {
    try {
      const isVideo = url.includes('video') || url.includes('operations') || fileName.endsWith('.mp4');
      const apiKey = googleApiKey || process.env.API_KEY;
      const finalUrl = isVideo ? `${url}${url.includes('?') ? '&' : '?'}key=${apiKey}` : url;
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(localUrl);
    } catch (e: any) { setError(e.message); }
  };

  const handleHistoryLoad = (p: SavedProject) => {
    setIntroScript(p.script); // Legacy support
    setBodyScript("");
    setGeneratedMedia(p.media);
    setFalAiKey(p.falAiKey || "");
    setIsHistoryOpen(false);
    setCurrentStep(3);
  };

  // --- Render Steps ---

  // Step 1: Input
  const renderStep1 = () => (
    <div className="animate-in slide-in-from-right duration-500">
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2.5rem] toss-shadow overflow-hidden p-8">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-2xl font-black text-[#191f28]">STEP 1. 대본 입력</h3>
             <span className="bg-[#e8f3ff] text-[#3182f6] px-4 py-1 rounded-full font-bold text-xs">INTRO & BODY</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#8b95a1] uppercase tracking-wider">Intro / Hook (2문장 단위)</label>
              <textarea 
                className="w-full p-6 bg-[#f9fafb] border border-gray-200 rounded-3xl focus:outline-none focus:border-[#3182f6] focus:bg-white transition-all min-h-[400px] text-lg font-medium leading-relaxed resize-none" 
                value={introScript} 
                onChange={(e) => setIntroScript(e.target.value)} 
                placeholder="시청자를 사로잡을 초반 훅(Hook) 대본을 입력하세요." 
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#8b95a1] uppercase tracking-wider">Main Body (3-4문장 / 의미 단위)</label>
              <textarea 
                className="w-full p-6 bg-[#f9fafb] border border-gray-200 rounded-3xl focus:outline-none focus:border-[#3182f6] focus:bg-white transition-all min-h-[400px] text-lg font-medium leading-relaxed resize-none" 
                value={bodyScript} 
                onChange={(e) => setBodyScript(e.target.value)} 
                placeholder="영상의 핵심 내용을 담은 본론 대본을 입력하세요." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Plan Review
  const renderStep2 = () => (
    <div className="animate-in slide-in-from-right duration-500">
       <div className="bg-white rounded-[2.5rem] toss-shadow p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-2xl font-black text-[#191f28]">STEP 2. AI 연출 계획 확인</h3>
             <span className="text-sm text-[#8b95a1] font-medium">총 {generatedMedia.length}개 장면이 설계되었습니다.</span>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {generatedMedia.map((scene, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl border border-gray-100 bg-[#f9fafb] hover:bg-white hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-[#191f28] text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#3182f6] bg-[#e8f3ff] px-2 py-0.5 rounded-md">SCENE {idx + 1}</span>
                    {scene.isIntro && (
                      <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-md ml-1">INTRO</span>
                    )}
                  </div>
                  <p className="text-[#191f28] font-bold mb-3">{scene.originalScriptSegment}</p>
                  <div className="text-xs text-[#8b95a1] bg-white p-3 rounded-xl border border-dashed border-gray-200">
                    <span className="font-bold text-[#4e5968] block mb-1">[Visual Prompt]</span>
                    {scene.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );

  // Step 3: Production
  const renderStep3 = () => (
    <div className="animate-in slide-in-from-right duration-500">
       <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h2 className="text-4xl font-black text-[#191f28] tracking-tight">STEP 3. Production Studio</h2>
            <p className="text-[#8b95a1] font-semibold mt-2">생성된 플랜을 기반으로 이미지, 비디오, TTS를 제작합니다.</p>
          </div>
          <div className="flex gap-3">
              <Button onClick={handleStartProduction} variant="primary" className="rounded-2xl h-14 px-8 bg-[#3182f6] text-white shadow-lg shadow-blue-200 animate-pulse">
                🖼️ 이미지 전체 자동 생성
              </Button>
          </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-9">
             <div className="flex flex-col space-y-5">
              {generatedMedia.map((m) => (
                <MediaCard 
                  key={m.index} 
                  media={m} 
                  onDownload={downloadFileSafe} 
                  onRegenerate={() => handleGenerateSingleImage(m.index)} 
                  onGenerateVideo={handleGenerateVideo} 
                  onGenerateTTS={handleGenerateTTS} 
                  onUpscale={handleUpscaleImage}
                  isDisabled={false} 
                />
              ))}
             </div>
          </div>
          <div className="lg:col-span-3">
             <div className="sticky top-10 space-y-4">
                <div className="bg-white p-6 rounded-[2rem] toss-shadow">
                   <h4 className="font-bold text-[#191f28] mb-4">Batch Actions</h4>
                   <Button onClick={handleGenerateAllTTS} fullWidth variant="secondary" className="bg-[#e8f3ff] text-[#1b64da] h-14 rounded-2xl font-bold mb-3 justify-start px-6" icon="🎙️">전체 TTS 생성</Button>
                   <Button onClick={handleUpscaleAllImages} fullWidth variant="secondary" className="bg-[#f3e8ff] text-[#7c3aed] h-14 rounded-2xl font-bold mb-3 justify-start px-6" icon="✨">전체 4K Upscale</Button>
                   <Button onClick={handleFinalZipDownload} fullWidth variant="primary" className="bg-[#191f28] text-white h-14 rounded-2xl font-bold justify-start px-6" icon="📦">전체 다운로드 (.zip)</Button>
                </div>
                <Button onClick={() => setShowThumbnailModal(true)} icon="🖼️" fullWidth variant="secondary" className="bg-white text-[#4e5968] h-14 rounded-2xl font-bold toss-shadow">썸네일 제작</Button>
             </div>
          </div>
       </div>
    </div>
  );

  // Navigation Logic
  const canGoNext = () => {
    if (currentStep === 1) return introScript.trim() || bodyScript.trim();
    if (currentStep === 2) return true;
    return false;
  };

  const handleNext = () => {
    if (currentStep === 1) handleAnalyzeAndPlan();
    else if (currentStep === 2) handleConfirmPlan();
  };

  // Auth Guard
  if (authLoading) return <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <AuthPage />;

  return (
    <div className="bg-[#f2f4f6] min-h-screen pb-20">
      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md toss-shadow text-center">
             <div className="w-16 h-16 bg-[#fff0f1] text-[#f04452] flex items-center justify-center rounded-full mx-auto mb-6 text-2xl font-bold">!</div>
             <h2 className="text-xl font-bold text-[#191f28] mb-4">서비스 이용 안내</h2>
             <div className="p-4 bg-[#f9fafb] rounded-xl mb-8 text-sm text-[#4e5968] font-medium leading-relaxed text-left max-h-[200px] overflow-y-auto">{error}</div>
             <Button onClick={() => setError(null)} className="w-full h-14 bg-[#3182f6] rounded-2xl font-bold text-lg text-white">확인</Button>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {loadingType !== 'none' && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg toss-shadow text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold text-[#191f28] mb-2 uppercase">
                {loadingType === 'planning' ? '대본 분석 및 설계 중' : 
                 loadingType === 'upscale' ? '4K 업스케일링 중' : 
                 loadingType === 'single_image' ? '개별 작업 처리 중' : '콘텐츠 생성 중'}
              </h2>
              <p className="text-[#4e5968] font-medium mb-8">{loadingStatus}</p>
              {/* Hide progress bar for planning and single operations */}
              {loadingType !== 'planning' && loadingType !== 'single_image' && (
                <div className="w-full bg-[#f2f4f6] h-3 rounded-full overflow-hidden mb-8">
                  <div className="bg-[#3182f6] h-full transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              )}
              <Button onClick={() => abortControllerRef.current?.abort()} variant="danger" className="w-full h-14 rounded-2xl font-bold bg-[#feeef0] text-[#f04452]">작업 취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-6 rounded-[2rem] toss-shadow">
          <div className="text-left flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#191f28] tracking-tight leading-none">YouTube <span className="text-[#3182f6]">Automation</span></h1>
              <p className="text-xs text-[#8b95a1] font-bold mt-1 uppercase tracking-wide">Step {currentStep} of 3</p>
            </div>
          </div>
          
          {/* Top Navigation Control */}
          <div className="flex gap-4 items-center">
             {currentStep > 1 && (
               <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="secondary" icon="⬅️" className="rounded-xl h-12 bg-[#f2f4f6] text-[#4e5968] font-bold">
                 Previous
               </Button>
             )}
             
             {currentStep < 3 && (
               <Button onClick={handleNext} variant="primary" icon="➡️" className="rounded-xl h-12 bg-[#3182f6] text-white font-bold px-6 shadow-lg shadow-blue-100">
                 Next Step
               </Button>
             )}

             <div className="w-px h-8 bg-gray-200 mx-2"></div>

             <Button onClick={() => setShowSettings(true)} variant="secondary" icon="⚙️" className="rounded-xl h-12 bg-white border border-gray-100 text-[#4e5968] font-bold" />
             <Button onClick={async () => { setHistoryProjects(await getProjects()); setIsHistoryOpen(true); }} variant="secondary" icon="📂" className="rounded-xl h-12 bg-white border border-gray-100 text-[#4e5968] font-bold" />
             <Button onClick={handleLogout} variant="secondary" className="rounded-xl h-12 bg-white border border-gray-100 text-[#f04452] font-bold px-4 hover:bg-red-50 hover:border-red-100">로그아웃</Button>
          </div>
        </header>

        <ApiKeyModal isOpen={showSettings} onClose={() => setShowSettings(false)} elevenLabsKey={elevenLabsKey} setElevenLabsKey={setElevenLabsKey} elevenLabsVoiceId={voiceId} setElevenLabsVoiceId={setVoiceId} falAiKey={falAiKey} setFalAiKey={setFalAiKey} googleApiKey={googleApiKey} setGoogleApiKey={setGoogleApiKey} />
        <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} projects={historyProjects} onLoad={handleHistoryLoad} onDelete={async (id) => { await deleteProject(id); setHistoryProjects(await getProjects()); }} />
        <ThumbnailModal isOpen={showThumbnailModal} onClose={() => setShowThumbnailModal(false)} script={introScript + " " + bodyScript} onGenerateText={generateThumbnailText} />

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default App;
