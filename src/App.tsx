import React, { useState, useEffect } from "react";
import { 
  Upload,
  Plus,
  Trash2,
  Save,
  Terminal, 
  Download, 
  Zap, 
  FileCode, 
  FolderSearch, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ChevronRight,
  Code2
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileData {
  name: string;
  content: string;
}

interface GenerationResult {
  files?: FileData[];
  error?: string;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [newFileName, setNewFileName] = useState("");

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.includes(".") ? newFileName : `${newFileName}.js`;
    const newFile = { name, content: "// New file content\n" };
    
    if (result) {
      const updatedFiles = [...(result.files || []), newFile];
      setResult({ ...result, files: updatedFiles });
      setSelectedFileIndex(updatedFiles.length - 1);
    } else {
      setResult({ files: [newFile] });
      setSelectedFileIndex(0);
    }
    setNewFileName("");
  };

  const handleDeleteFile = (idx: number) => {
    if (!result?.files) return;
    const updatedFiles = result.files.filter((_, i) => i !== idx);
    setResult({ ...result, files: updatedFiles });
    if (selectedFileIndex >= updatedFiles.length) {
      setSelectedFileIndex(Math.max(0, updatedFiles.length - 1));
    }
  };

  const handleUpdateFileContent = (newContent: string) => {
    if (!result?.files) return;
    const updatedFiles = [...result.files];
    updatedFiles[selectedFileIndex] = { 
      ...updatedFiles[selectedFileIndex], 
      content: newContent 
    };
    setResult({ ...result, files: updatedFiles });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newFile = { name: file.name, content };
        
        setResult(prev => {
          const files = prev?.files || [];
          const updatedFiles = [...files, newFile];
          return { ...prev, files: updatedFiles };
        });
      };
      reader.readAsText(file);
    });
    // Clear input
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setSelectedFileIndex(0);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to connect to the server." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result?.files) return;
    const zip = new JSZip();
    result.files.forEach((file) => {
      zip.file(file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "discord-bot-project.zip");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Discord Architect</h1>
              <p className="text-xs text-neutral-500 font-medium font-mono">v1.0.0-multi-agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-mono text-neutral-400">3 Keys Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[400px,1fr] gap-8">
          
          {/* Sidebar: Controls */}
          <section className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Request Details
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Create a Discord bot that tracks leveling and has a welcome system..."
                  className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-neutral-700"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Technology Stack
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["javascript", "python"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                        language === lang 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 group"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Docs...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Architect Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-4 flex items-start gap-3">
              <FolderSearch className="w-5 h-5 text-neutral-500 mt-1" />
              <p className="text-xs text-neutral-500 leading-relaxed">
                Our multi-agent system uses real-time search to verify Discord library versions and best practices across multiple documentation sources.
              </p>
            </div>
          </section>

          {/* Main Area: Output */}
          <section className="min-h-[600px] bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col">
            {!result && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-neutral-800 rounded-[2.5rem] flex items-center justify-center mb-4">
                  <FileCode className="w-10 h-10 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-300">Ready to Build</h3>
                <p className="text-sm text-neutral-500 max-w-sm">
                  Describe your bot and let our AI Architect generate a complete, working project with multiple files.
                </p>
              </div>
            ) : isGenerating ? (
               <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-neutral-800 border-t-indigo-600 rounded-full animate-spin" />
                    <Zap className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Synthesizing Logic</h3>
                    <div className="flex gap-1 justify-center">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i} 
                          className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" 
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
               </div>
            ) : result?.error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-red-400 space-y-4">
                <AlertCircle className="w-12 h-12" />
                <p className="font-medium">{result.error}</p>
                <button onClick={() => setResult(null)} className="text-xs underline text-neutral-500">Reset</button>
              </div>
            ) : (
              <>
                <div className="border-b border-neutral-800 bg-neutral-950/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {result.files?.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="flex items-center group">
                          <button
                            onClick={() => setSelectedFileIndex(idx)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-l-lg text-xs font-mono transition-all whitespace-nowrap border",
                              selectedFileIndex === idx 
                              ? "bg-neutral-800 border-neutral-700 text-white" 
                              : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"
                            )}
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            {file.name}
                          </button>
                          <button
                            onClick={() => handleDeleteFile(idx)}
                            className={cn(
                              "px-2 py-1.5 rounded-r-lg border-y border-r transition-all",
                              selectedFileIndex === idx
                              ? "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-red-400"
                              : "bg-transparent border-transparent text-transparent group-hover:text-neutral-600 hover:text-red-400"
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        placeholder="new-file.js"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFile()}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-xs font-mono focus:ring-1 focus:ring-indigo-500/50 outline-none w-32"
                      />
                      <button 
                        onClick={handleAddFile}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 transition-colors"
                        title="Add empty file"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <label 
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 transition-colors cursor-pointer"
                        title="Upload files"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-lg text-xs font-bold transition-all border border-emerald-600/20 self-start"
                  >
                    <Download className="w-4 h-4" />
                    ZIP Project
                  </button>
                </div>

                <div className="flex-1 overflow-hidden font-mono text-sm bg-neutral-950 relative">
                  <textarea
                    value={result.files?.[selectedFileIndex]?.content || ""}
                    onChange={(e) => handleUpdateFileContent(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full bg-transparent p-6 text-neutral-300 leading-relaxed outline-none resize-none selection:bg-indigo-500/30"
                  />
                  <div className="absolute bottom-4 right-6 pointer-events-none text-[10px] text-neutral-700 font-bold uppercase tracking-widest border border-neutral-800/50 px-2 py-1 rounded bg-neutral-950/50 backdrop-blur">
                    Editor Live
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-neutral-900 py-8 px-4 mt-12 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Configuration Status</span>
            </div>
            <p className="text-xs text-neutral-600">The Architect is currently configured with Gemini 2.0 & Simulation Multi-Keys.</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-neutral-400 font-medium">Docs Search Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-neutral-400 font-medium">Zip Generator Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
