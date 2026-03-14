/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Image as ImageIcon, 
  Video, 
  Volume2, 
  Share2, 
  Brain, 
  ChevronRight, 
  Loader2, 
  CheckCircle2,
  Play,
  Pause,
  RefreshCw,
  Award
} from 'lucide-react';
import Markdown from 'react-markdown';
import mermaid from 'mermaid';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateEducationalContent, generateImage, generateAudio, generateVideo, type EduContent } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div className="flex justify-center my-8 overflow-x-auto p-4 bg-white rounded-xl border border-black/5 shadow-sm">
      <div ref={ref} className="mermaid">
        {chart}
      </div>
    </div>
  );
};

export default function App() {
  const [topic, setTopic] = useState('LLM');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('advanced');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<EduContent | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setContent(null);
    setImages([]);
    setAudioUrl('');
    setVideoUrl('');
    
    try {
      const data = await generateEducationalContent(topic, level);
      setContent(data);
      
      // Generate images in parallel
      const imagePrompts = data.imagePrompts || [];
      const imagePromises = imagePrompts.slice(0, 4).map(prompt => generateImage(prompt));
      const generatedImages = await Promise.all(imagePromises);
      setImages(generatedImages);

      // Generate audio
      const audio = await generateAudio(data.audioScript);
      setAudioUrl(audio);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!content) return;
    setGeneratingVideo(true);
    try {
      const url = await generateVideo(content.summary);
      setVideoUrl(url);
    } catch (error) {
      console.error('Video generation failed:', error);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F5F2ED]/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Brain size={24} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">EduCine AI</h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-60">
            <span>Explore</span>
            <span>My Library</span>
            <span>Challenges</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif font-light mb-6 leading-tight"
          >
            Learn anything, <br />
            <span className="italic text-emerald-700">multimodally.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg opacity-60 max-w-xl mx-auto mb-10"
          >
            Enter any topic and our AI tutor will generate a complete learning experience with summaries, diagrams, images, and audio.
          </motion.p>

          <form onSubmit={handleGenerate} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What do you want to learn today?"
                className="w-full h-16 pl-14 pr-32 bg-white rounded-2xl border border-black/10 shadow-xl shadow-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={24} />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate'}
              </button>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    level === l 
                      ? "bg-black text-white border-black" 
                      : "bg-white text-black/60 border-black/5 hover:border-black/20"
                  )}
                >
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </form>
        </section>

        {/* Content Display */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={24} />
              </div>
              <p className="text-lg font-medium animate-pulse">Crafting your learning journey...</p>
              <p className="text-sm opacity-50">Generating diagrams, images, and audio narration</p>
            </motion.div>
          ) : content ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pb-24"
            >
              {/* Summary Card */}
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 text-emerald-700">
                  <BookOpen size={20} className="md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest">Summary</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-serif mb-6 leading-tight">{topic}</h3>
                <p className="text-lg md:text-xl leading-relaxed opacity-80 mb-8">
                  {content.summary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider mb-4 opacity-40">Key Points</h4>
                    <ul className="space-y-3">
                      {(content.keyPoints || []).map((point, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" size={18} />
                          <span className="font-medium text-sm md:text-base">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider mb-4 opacity-40">Real World Examples</h4>
                    <ul className="space-y-3">
                      {(content.realWorldExamples || []).map((ex, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0" />
                          <span className="italic opacity-70 text-sm md:text-base">{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Audio Narration */}
              {audioUrl && (
                <div className="bg-emerald-900 text-white rounded-2xl md:rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Volume2 size={28} className="md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 text-center md:text-left w-full">
                    <h4 className="text-lg md:text-xl font-medium mb-2">Listen to the Story</h4>
                    <p className="opacity-70 text-xs md:text-sm mb-4">An AI-generated narration of the topic to help you learn through listening.</p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={toggleAudio}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white text-emerald-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
                      >
                        {isPlaying ? <Pause size={20} className="md:w-6 md:h-6" /> : <Play size={20} className="md:w-6 md:h-6 ml-1" />}
                      </button>
                      <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-white"
                          animate={{ width: isPlaying ? '100%' : '0%' }}
                          transition={{ duration: 30, ease: "linear" }}
                        />
                      </div>
                    </div>
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Detailed Explanation */}
              <div className="prose prose-lg max-w-none prose-emerald">
                <div className="flex items-center gap-3 mb-6 text-emerald-700">
                  <Brain size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Deep Dive</span>
                </div>
                <div className="markdown-body">
                  <Markdown>{content.simpleExplanation}</Markdown>
                </div>
              </div>

              {/* Visuals - Diagram */}
              <div>
                <div className="flex items-center gap-3 mb-6 text-emerald-700">
                  <RefreshCw size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Process Flow</span>
                </div>
                <Mermaid chart={content.mermaidDiagram} />
              </div>

              {/* Visuals - Images */}
              <div>
                <div className="flex items-center gap-3 mb-6 text-emerald-700">
                  <ImageIcon size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Visual Aids</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.length > 0 ? images.map((img, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square rounded-2xl overflow-hidden shadow-md bg-white border border-black/5"
                    >
                      <img src={img} alt={`Illustration ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </motion.div>
                  )) : (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-black/5 animate-pulse" />
                    ))
                  )}
                </div>
              </div>

              {/* Video Experience */}
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 border border-black/5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <Video size={20} className="md:w-6 md:h-6" />
                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest">Video Experience</span>
                  </div>
                  {!videoUrl && (
                    <button 
                      onClick={handleGenerateVideo}
                      disabled={generatingVideo}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      {generatingVideo ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                      {generatingVideo ? 'Generating Video...' : 'Generate AI Video'}
                    </button>
                  )}
                </div>

                {videoUrl ? (
                  <div className="aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-black shadow-xl">
                    <video src={videoUrl} controls className="w-full h-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm opacity-50 italic">AI has drafted a script for your educational video. Click "Generate AI Video" to bring it to life with Veo.</p>
                    <div className="grid gap-4 md:gap-6">
                      {(content.videoScript?.scenes || []).map((scene, i) => (
                        <div key={i} className="flex gap-4 md:gap-6">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 flex-shrink-0 text-sm md:text-base">
                            {i + 1}
                          </div>
                          <div>
                            <h5 className="font-bold mb-1 text-sm md:text-base">{scene.scene}</h5>
                            <p className="opacity-70 text-xs md:text-sm leading-relaxed">{scene.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="bg-black text-white rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8 text-emerald-400">
                  <Share2 size={20} className="md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest">Share Knowledge</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <span className="text-[10px] md:text-xs font-bold uppercase opacity-40 tracking-wider">Instagram</span>
                    <p className="text-sm opacity-80 leading-relaxed line-clamp-4">{content.socialMedia.instagram}</p>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] md:text-xs font-bold uppercase opacity-40 tracking-wider">LinkedIn</span>
                    <p className="text-sm opacity-80 leading-relaxed line-clamp-4">{content.socialMedia.linkedin}</p>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] md:text-xs font-bold uppercase opacity-40 tracking-wider">Twitter</span>
                    <p className="text-sm opacity-80 leading-relaxed line-clamp-4">{content.socialMedia.twitter}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {(content.socialMedia?.hashtags || []).map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-[10px] md:text-xs font-medium hover:bg-white/20 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quiz Section */}
              <div className="bg-emerald-50 rounded-2xl md:rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 text-emerald-700">
                  <Award size={20} className="md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest">Quick Quiz</span>
                </div>
                <div className="space-y-8 md:space-y-12">
                  {(content.quiz || []).map((q, i) => (
                    <div key={i} className="space-y-4">
                      <p className="font-bold text-base md:text-lg leading-tight">{i + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options || []).map((opt, j) => (
                          <button 
                            key={j}
                            className="p-4 bg-white rounded-xl border border-emerald-200 text-left hover:border-emerald-500 hover:shadow-sm transition-all font-medium text-sm md:text-base"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center opacity-20"
            >
              <Brain size={80} className="mx-auto mb-4" />
              <p className="text-xl">Ready to learn something new?</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Brain className="text-emerald-600" size={24} />
            <span className="font-bold tracking-tighter">EDUCINE AI</span>
          </div>
          <p className="text-sm opacity-40">© 2026 EduCine AI. Powered by Google Gemini.</p>
          <div className="flex gap-6 text-sm font-medium opacity-60">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
