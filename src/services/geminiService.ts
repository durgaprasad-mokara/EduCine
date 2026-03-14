import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface EduContent {
  summary: string;
  keyPoints: string[];
  simpleExplanation: string;
  realWorldExamples: string[];
  mermaidDiagram: string;
  imagePrompts: string[];
  socialMedia: {
    instagram: string;
    linkedin: string;
    twitter: string;
    hashtags: string[];
  };
  audioScript: string;
  videoScript: {
    scenes: { scene: string; description: string }[];
  };
  quiz: { question: string; options: string[]; answer: string }[];
}

export async function generateEducationalContent(topic: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<EduContent> {
  const model = "gemini-3.1-pro-preview"; // Using pro for complex reasoning
  
  const prompt = `You are an expert educational AI tutor. Explain the topic: "${topic}" for a ${level} level student.
  
  Generate a comprehensive educational package in JSON format.
  
  Structure:
  {
    "summary": "A concise summary of the topic",
    "keyPoints": ["Point 1", "Point 2", ...],
    "simpleExplanation": "A detailed but easy to understand explanation",
    "realWorldExamples": ["Example 1", "Example 2", ...],
    "mermaidDiagram": "A Mermaid.js flowchart or mindmap code explaining the process or structure",
    "imagePrompts": ["4 descriptive prompts for generating educational illustrations for this topic"],
    "socialMedia": {
      "instagram": "Caption for Instagram",
      "linkedin": "Post for LinkedIn",
      "twitter": "Thread for Twitter",
      "hashtags": ["#tag1", "#tag2", ...]
    },
    "audioScript": "A storytelling narration script for an audio explanation",
    "videoScript": {
      "scenes": [
        {"scene": "Scene 1", "description": "Visual description and narration text"},
        ...
      ]
    },
    "quiz": [
      {"question": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct option"}
    ]
  }
  
  Ensure there are exactly 5 quiz questions in the "quiz" array.
  Ensure the mermaidDiagram is valid Mermaid syntax.
  Ensure the explanation is engaging and uses storytelling if possible.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          simpleExplanation: { type: Type.STRING },
          realWorldExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
          mermaidDiagram: { type: Type.STRING },
          imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
          socialMedia: {
            type: Type.OBJECT,
            properties: {
              instagram: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              twitter: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          audioScript: { type: Type.STRING },
          videoScript: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scene: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ text: prompt }],
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export async function generateAudio(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Narrate this educationally: ${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : "";
}

export async function generateVideo(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Educational animation: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
