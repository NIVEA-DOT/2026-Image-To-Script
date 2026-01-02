
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TEXT_ANALYSIS_MODEL, IMAGE_GENERATION_MODEL } from '../constants';
import { AspectRatio, ArtStyle } from '../types';

const getApiKey = (): string => {
  return process.env.API_KEY || localStorage.getItem('google_api_key') || "";
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

function robustJsonParse(text: string | undefined): any {
  if (!text) throw new Error("AI 응답이 없습니다.");
  try {
    return JSON.parse(text.trim());
  } catch {
    try {
      let cleaned = text.replace(/```json\s*|```/g, '').trim();
      const startArr = cleaned.indexOf('[');
      const endArr = cleaned.lastIndexOf(']');
      const startObj = cleaned.indexOf('{');
      const endObj = cleaned.lastIndexOf('}');
      if (startArr !== -1 && endArr !== -1 && (startArr < startObj || startObj === -1)) {
        return JSON.parse(cleaned.substring(startArr, endArr + 1));
      } else if (startObj !== -1 && endObj !== -1) {
        return JSON.parse(cleaned.substring(startObj, endObj + 1));
      }
      throw new Error("JSON 형식을 찾을 수 없습니다.");
    } catch (e) {
      console.error("JSON 파싱 실패 원본 텍스트:", text);
      throw new Error("데이터 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }
  }
}

// Hardcoded Style Instruction for Stickman
const STICKMAN_STYLE_INSTRUCTION = `
  [STYLE RULE: 2D CARTOON STICKMAN]
  1. STYLE DEFINITION: 2D Cartoon & Flash Animation style. BOLD outlines, FLAT colors, vibrant saturation. NO photorealism, NO 3D rendering.
  2. CHARACTER: Protagonist is a "Helmet-wearing Stick Figure". Body is a simple black line circle-man. The helmet is a simple, cute round red helmet. Avoid complex mechanical designs.
  3. ADAPTIVE BACKGROUND (Choose one):
     - Style A (Info-driven): If the text segment contains data/facts, use stylized cartoon infographics, charts, graphs, and cute Korean hand-drawn style typography (Hangul).
     - Style B (Atmospheric): If the text segment is descriptive, use simple graphic cartoon scenery.
`;

export async function analyzeSegmentsForPrompts(
  segments: string[],
  onStatusUpdate?: (msg: string) => void
): Promise<{ scriptSegment: string; imagePrompt: string; videoMotionPrompt: string }[]> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const results: { scriptSegment: string; imagePrompt: string; videoMotionPrompt: string }[] = [];
  const batchSize = 4;
  
  const characterDescription = "A simple 2D stick figure with a black line body and a distinct round red cartoon helmet.";

  for (let i = 0; i < segments.length; i += batchSize) {
    const currentBatch = segments.slice(i, i + batchSize);
    const contextPrompt = `
      ${STICKMAN_STYLE_INSTRUCTION}
      [TASK: CONTINUOUS CARTOON STORYBOARD]
      Protagonist: ${characterDescription}
      
      각 장면의 맥락을 분석하여 [Style A: 정보 전달형] 또는 [Style B: 상황 묘사형] 중 최적의 연출을 선택해 영어 프롬프트를 작성하세요.
      반드시 각 장면의 원본 대본 문구를 "scriptSegment" 필드에 그대로 포함해야 합니다.
      
      Segments:
      ${currentBatch.map((s, idx) => `[Scene ${i + idx}]: ${s}`).join('\n')}
      
      JSON 응답 형식: [{"scriptSegment": "원본 대본", "image_prompt": "English Visual Prompt", "videoMotionPrompt": "Motion description"}]
    `;
    const response = await ai.models.generateContent({
      model: TEXT_ANALYSIS_MODEL,
      contents: contextPrompt,
      config: { responseMimeType: "application/json" }
    });
    
    const data = robustJsonParse(response.text);
    const normalizedData = data.map((item: any) => ({
      scriptSegment: item.scriptSegment || item.korean_segment || item.text || "대본 데이터 누락",
      imagePrompt: item.image_prompt || item.imagePrompt || "",
      videoMotionPrompt: item.motion_prompt || item.videoMotionPrompt || "Simple 2D animation slide."
    }));
    
    results.push(...normalizedData);
    onStatusUpdate?.(`비주얼 분석 중... (${Math.min(i + batchSize, segments.length)}/${segments.length})`);
  }
  return results;
}

export async function generateImage(
  prompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Enforce Stickman Style and Korean Text
  const finalPrompt = `${prompt}. Style: 2D cartoon illustration, bold black outlines, flat colors, flash animation style, simple graphic background, high quality, no photorealism, no 3D effects. Character is a stick man with a red round helmet. 
  IMPORTANT: If there is any text inside the image, it MUST be written in Korean (Hangul). Do not use English text in the image.`;

  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: IMAGE_GENERATION_MODEL,
    contents: { parts: [{ text: `High-quality masterpiece, ${finalPrompt}. Clean and sharp lines, no blurry parts, no watermarks.` }] },
    config: { imageConfig: { aspectRatio: AspectRatio.SIXTEEN_NINE, imageSize: "1K" } }
  }));
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  throw new Error("이미지 생성 도중 오류가 발생했습니다.");
}

export async function generateThumbnailText(script: string): Promise<{ topText: string; bottomText: string }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: TEXT_ANALYSIS_MODEL,
    contents: `자극적인 썸네일 문구 2줄 생성. 대본: ${script.slice(0, 1000)}\n{"topText": "1행", "bottomText": "2행"}`,
    config: { responseMimeType: "application/json" }
  });
  return robustJsonParse(response.text);
}

export async function refineScript(script: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: TEXT_ANALYSIS_MODEL,
    contents: `대본 수정: ${prompt}\n대본: ${script}`
  });
  return response.text || script;
}

export async function generateVideoFromImage(imageBase64: string, motionPrompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: motionPrompt,
    image: { imageBytes: imageBase64.split(',')[1], mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }
  return operation.response?.generatedVideos?.[0]?.video?.uri || "";
}
