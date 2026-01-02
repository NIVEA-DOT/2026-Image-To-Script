
import { AspectRatio, ArtStyle } from './types';

export const TEXT_ANALYSIS_MODEL = 'gemini-3-flash-preview'; 
export const IMAGE_GENERATION_MODEL = 'gemini-3-pro-image-preview'; 
export const MAX_SCRIPT_LENGTH = 30000;
export const MAX_IMAGES = 500;
export const API_KEY_PERMISSION_ERROR_MESSAGE = "API_KEY_PERMISSION_ERROR_IDENTIFIER";
export const API_QUOTA_EXCEEDED_MESSAGE = "API_QUOTA_EXCEEDED_IDENTIFIER";
export const API_RATE_LIMITS_URL = "https://ai.google.dev/gemini-api/docs/rate-limits";

// Default configurations
export const DEFAULT_ASPECT_RATIO = AspectRatio.SIXTEEN_NINE;
export const DEFAULT_ART_STYLE = ArtStyle.STICKMAN;
