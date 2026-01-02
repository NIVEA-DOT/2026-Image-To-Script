
export enum AspectRatio {
  SIXTEEN_NINE = '16:9',
}

export enum ArtStyle {
  STICKMAN = 'Stickman style',
}

export interface GeneratedMedia {
  originalScriptSegment: string;
  prompt: string;
  videoMotionPrompt?: string; 
  mediaUrl: string; 
  videoUrl?: string; 
  audioUrl?: string; 
  index: number;
  isProcessing?: boolean;
  isVideoProcessing?: boolean;
  isAudioProcessing?: boolean;
  isUpscaling?: boolean; // New state for upscaling
  isIntro?: boolean; // New state to identify intro segments
}

export interface SavedProject {
  id: string;
  timestamp: number;
  script: string;
  media: GeneratedMedia[];
  elevenLabsKey?: string;
  elevenLabsVoiceId?: string;
  falAiKey?: string; // New key
  aspectRatio?: string;
  artStyle?: string;
  customArtStyle?: string;
}
