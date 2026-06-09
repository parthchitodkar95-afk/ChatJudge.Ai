import React, { useState, useEffect, useRef, RefObject, useMemo } from "react";
import { 
  Gavel, 
  Send, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  ExternalLink, 
  Info, 
  TrendingUp, 
  FileText, 
  MessageSquare, 
  Smile, 
  Meh, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  UserCheck,
  Activity,
  Award,
  Flame,
  Scale,
  BarChart2,
  Clock,
  Moon,
  Sun,
  Download,
  Share2,
  Copy,
  Check,
  Heart,
  Shield
} from "lucide-react";
import QRCode from "qrcode";
import { ChatJudgeReport, PersonAnalysis, Evidence } from "./types";
import { SAMPLE_CHAT_TEXT, SAMPLE_CHAT_ANALYSIS } from "./sampleData";
import { parseChatAndCalculateAnalytics } from "./utils/analyticsParser";
import { generateProgrammaticPDF } from "./utils/pdfGenerator";
import RadarChart from "./components/RadarChart";
import ComparisonRadarChart from "./components/ComparisonRadarChart";

// Helper for dynamic colors
const AVATAR_COLORS = [
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
];

const TRAIT_CONFIG = {
  toxicity: { label: "Toxicity", icon: "☠️", color: "bg-red-500", text: "text-red-400" },
  ego: { label: "Ego", icon: "👑", color: "bg-orange-500", text: "text-orange-400" },
  attitude: { label: "Attitude", icon: "😤", color: "bg-orange-500", text: "text-orange-400" },
  love: { label: "Love", icon: "❤️", color: "bg-green-500", text: "text-green-400" },
  hate: { label: "Hate", icon: "😡", color: "bg-red-500", text: "text-red-400" },
  humor: { label: "Humor", icon: "😂", color: "bg-green-500", text: "text-green-400" },
  coldness: { label: "Coldness", icon: "🧊", color: "bg-neutral-500", text: "text-neutral-400" },
  dominance: { label: "Dominance", icon: "🗣️", color: "bg-orange-500", text: "text-orange-400" },
} as const;

// Animated subtitle cycling words
const CYCLING_SUBTITLES = ["Who's toxic?", "Who has ego?", "Who actually cares?"];

// Animated loading rotating messages
const LOADING_MESSAGES = [
  "Reading every message...",
  "Judging silently...",
  "Checking passive-aggression levels...",
  "Exposing ego lords...",
  "Running psychological diagnostics...",
  "Almost done exposing everyone..."
];

export default function App() {
  // UI Refs for scrolling
  const inputSectionRef = useRef<HTMLDivElement | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // Core App State
  const [chatText, setChatText] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ChatJudgeReport | null>(null);
  const [activeRoast, setActiveRoast] = useState<Record<string, boolean>>({});

  // Theme state: dark or light. Default to 'dark' to retain original aesthetics
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("chatjudge_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("chatjudge_theme", nextTheme);
  };

  // Synchronize theme state with the html class list
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Client-side Chat Analytics Engine
  const chatAnalytics = useMemo(() => {
    if (!analysisResult || !chatText) return null;
    try {
      return parseChatAndCalculateAnalytics(chatText);
    } catch (e) {
      console.error("Failed to compute chat analytics:", e);
      return null;
    }
  }, [analysisResult, chatText]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sharing & QR Code State variables
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Read-only Shared view state variables
  const [isSharedLoading, setIsSharedLoading] = useState(false);
  const [sharedErrorState, setSharedErrorState] = useState<string | null>(null);
  const [isSharedReportView, setIsSharedReportView] = useState(false);

  // Parse and fetch shared report on mount if specified
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("share");
    if (shareId) {
      setIsSharedLoading(true);
      setIsSharedReportView(true);
      fetch(`/api/share/${shareId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Could not retrieve shared report");
          return res.json();
        })
        .then((data) => {
          setAnalysisResult(data.analysisResult);
          setChatText(data.chatText);
          setIsSharedLoading(false);
          // Scroll smoothly to results once they render on next tick
          setTimeout(() => {
            const el = document.getElementById("results-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 450);
        })
        .catch((err) => {
          console.error(err);
          setSharedErrorState("The shared report you are looking for has expired or does not exist.");
          setIsSharedLoading(false);
          setIsSharedReportView(false);
        });
    }
  }, []);

  const handleShareReport = async () => {
    if (!analysisResult) return;
    setIsSharing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisResult, chatText }),
      });
      if (!response.ok) {
        throw new Error("Failed to register share link with server.");
      }
      const data = await response.json();
      const generatedUrl = `${window.location.origin}${window.location.pathname}?share=${data.id}`;
      setShareUrl(generatedUrl);

      // Generate local QR Code safely
      const qrDataUrl = await QRCode.toDataURL(generatedUrl, {
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        margin: 2,
        width: 250,
      });
      setQrCodeUrl(qrDataUrl);
      setShowShareModal(true);
      setCopiedLink(false);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to generate share link.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!analysisResult) return;
    setIsExportingPDF(true);
    try {
      generateProgrammaticPDF(analysisResult, chatAnalytics);
    } catch (e) {
      console.error("PDF generation error: ", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Animated tickers
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [subtitleFade, setSubtitleFade] = useState(true);
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Subtitle cycle interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleFade(false);
      setTimeout(() => {
        setSubtitleIndex((prev) => (prev + 1) % CYCLING_SUBTITLES.length);
        setSubtitleFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Loading rotating messages interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing) {
      timer = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2300);
    } else {
      setLoadingIndex(0);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Handle auto scrolling
  const scrollTo = (elementRef: RefObject<HTMLDivElement | null>) => {
    elementRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle scrolling to DOM elements by id
  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Preload Sample chat
  const handleLoadSample = () => {
    setChatText(SAMPLE_CHAT_TEXT);
    setErrorStatus(null);
    setIsDemoMode(true);
    // Visual feedback
    if (inputSectionRef.current) {
      scrollTo(inputSectionRef);
    }
  };

  // Validates the chat length requirement
  const validateChatInput = (text: string): boolean => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let potentialMessageCount = 0;
    
    // Check line structures mimicking message formatting
    for (const line of lines) {
      if (line.includes(":") && (line.includes("-") || line.includes("/") || line.includes("["))) {
        potentialMessageCount++;
      }
    }
    // Fallback: If formatted chat split is loose, check raw valid message segments
    if (potentialMessageCount < 5) {
      return lines.length >= 5;
    }
    return potentialMessageCount >= 5;
  };

  // Core API Analysis handler
  const handleAnalyzeChat = async () => {
    setErrorStatus(null);
    setAnalysisResult(null);

    // Validate chat
    if (!chatText.trim()) {
      setErrorStatus("Please paste a WhatsApp chat export to analyze.");
      return;
    }

    if (!validateChatInput(chatText)) {
      setErrorStatus("Chat too short. Paste a longer conversation (at least 5 messages).");
      return;
    }

    // Default preloaded demo payload fallback for instantaneous presentation
    if (chatText.trim() === SAMPLE_CHAT_TEXT.trim()) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setAnalysisResult(SAMPLE_CHAT_ANALYSIS);
        setIsAnalyzing(false);
        // Scroll to result target
        setTimeout(() => scrollTo(resultsSectionRef), 150);
      }, 1500);
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatText })
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `Server connection failed with error ${response.status}.`);
      }

      const parsedReport = await response.json();
      setAnalysisResult(parsedReport);
      
      // Smooth scroll to display results
      setTimeout(() => scrollTo(resultsSectionRef), 150);

    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Analysis failed. Verify your server GEMINI_API_KEY is configured correctly under Settings > Secrets.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate mapping of unique colors per participant
  const getColorMap = (persons: PersonAnalysis[]) => {
    const map: { [key: string]: string } = {};
    persons.forEach((p, idx) => {
      map[p.name] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
    });
    return map;
  };

  const activeColorMap = analysisResult ? getColorMap(analysisResult.persons) : {};

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-100 selection:bg-[#FF4444] selection:text-white flex flex-col font-sans">
      
      {isSharedLoading && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in animate-duration-300">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
          <div className="bg-[#111111] border border-[#2A2A2A] p-8 rounded-2xl max-w-sm w-full relative shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center mb-6" />
            <h3 className="font-heading text-lg font-black uppercase tracking-widest text-slate-100">Accessing Shared Dossier</h3>
            <p className="text-xs text-slate-500 font-mono tracking-wider mt-2 uppercase">Retrieving case record from secure memory store...</p>
          </div>
        </div>
      )}

      {sharedErrorState && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#111111]/90 border border-red-500/30 p-8 rounded-2xl max-w-md w-full relative shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="font-heading text-lg font-black uppercase tracking-widest text-[#FF4444]">DOSSIER ERROR</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-3">{sharedErrorState}</p>
            <button
              onClick={() => {
                setSharedErrorState(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs uppercase tracking-widest font-bold transition-all cursor-pointer font-heading"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {isSharedReportView && !isSharedLoading && (
        <div className="bg-amber-600/10 border-b border-amber-600/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300 font-medium select-none gap-3 z-25">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-black text-[9px] px-1.5 py-0.5 rounded font-black uppercase font-mono animate-pulse">Shared View</span>
            <span>You are viewing a shared forensic verdict for <strong>{analysisResult ? analysisResult.persons.map(p => p.name).join(" vs ") : "this chat"}</strong>.</span>
          </div>
          <button
            onClick={() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              setAnalysisResult(null);
              setChatText("");
              setIsSharedReportView(false);
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            Judge Your Own Chats
          </button>
        </div>
      )}

      {/* IMMERSIVE HEADER PANEL */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-8 py-4 border-b border-[#2A2A2A] bg-[#111111] gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="text-[#FF4444] text-2xl md:text-3xl font-bold tracking-tighter flex items-center select-none">
            <span className="mr-2">⚖️</span>
            <span className="font-heading uppercase">CHATJUDGE</span>
          </div>
          <span className="bg-[#FF4444]/10 text-[#FF4444] text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-widest border border-[#FF4444]/20 select-none">Verdict: Final</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
          <span>Analysis Depth: Brutal</span>
          <span className="text-zinc-800 select-none">|</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-slate-300 rounded-lg transition-all duration-200 cursor-pointer outline-none select-none active:scale-95 text-[9px] font-bold"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden border-b border-[#2A2A2A] bg-radial-gradient">
        {/* Absolute Background Accent Glares */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-[20%] w-72 h-72 bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="z-10 max-w-4xl px-2">
          {/* Gavel icon logo */}
          <div className="inline-flex p-4 bg-[#111111] rounded-full border border-red-500/20 shadow-xl shadow-red-500/5 mb-6 text-[#FF4444]">
            <Gavel className="w-12 h-12" id="hero-gavel-logo" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4">
            Chat<span className="text-[#FF4444]">Judge</span>
          </h1>

          <p className="text-xl md:text-2xl font-light text-gray-400 mb-8 font-heading">
            Paste a chat. <span className="font-semibold text-gray-200">AI will expose everyone.</span>
          </p>

          <div className="h-12 flex items-center justify-center text-lg md:text-xl font-mono text-gray-300">
            <span className="mr-2">Checking:</span>
            <div className="w-48 text-left">
              <span className={`inline-block text-[#FF4444] font-semibold transition-all duration-300 ${subtitleFade ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}`}>
                {CYCLING_SUBTITLES[subtitleIndex]}
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo(inputSectionRef)}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg shadow-lg hover:shadow-red-950/40 hover:-translate-y-0.5 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              id="cta-start"
            >
              <Sparkles className="w-5 h-5" /> Start Analyzing
            </button>
            <button
              onClick={handleLoadSample}
              className="px-8 py-4 bg-[#161616] hover:bg-[#202020] text-gray-200 border border-[#2a2a2a] rounded-lg transition duration-200 cursor-pointer"
              id="cta-demo"
            >
              Try Preloaded Demo
            </button>
          </div>
        </div>

        {/* Down Arrow subtle prompt */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 animate-bounce cursor-pointer flex flex-col items-center gap-1" onClick={() => scrollTo(inputSectionRef)}>
          <span className="text-xs tracking-widest font-mono">SCROLL</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 2. CHAT INPUT SECTION */}
      <section ref={inputSectionRef} className="max-w-4xl w-full mx-auto px-4 py-16 scroll-mt-6" id="input-section">
        
        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 md:p-8 shadow-2xl relative">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-1">WhatsApp Chat Input Log</label>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5.5 h-5.5 text-[#FF4444]" /> Raw Chat Records
              </h2>
            </div>
            
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-[#202020] hover:bg-[#2e2e2e] text-xs text-amber-400 border border-[#2a2a2a] rounded flex items-center gap-1.5 transition ml-auto md:ml-0 cursor-pointer"
              title="Loads standard WhatsApp chat format between Rahul & Priya"
              id="btn-load-sample"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Preload Sample Log
            </button>
          </div>

          {/* Textarea */}
          <div className="mb-6 space-y-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">WhatsApp Chat Data</label>
            <textarea
              value={chatText}
              onChange={(e) => {
                setChatText(e.target.value);
                setErrorStatus(null);
              }}
              placeholder={`12/01/25, 10:00 AM - Rahul: bhai tune aaj bhi late kiya&#10;12/01/25, 10:02 AM - Priya: sorry yaar traffic tha&#10;...&#10;Paste WhatsApp chat logs here...`}
              rows={8}
              className="w-full bg-[#080808] border border-[#2A2A2A] rounded-lg p-4 font-mono text-xs md:text-sm text-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-700 block min-h-[200px]"
              id="chat-textarea"
            />
            {/* Instructions box */}
            <div className="mt-3 flex items-start gap-2.5 text-xs text-neutral-400 bg-neutral-900/30 p-3.5 rounded-md border border-neutral-900 leading-relaxed">
              <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-300">How to export logs:</p>
                <p className="mt-0.5 text-neutral-400">
                  Open chat in WhatsApp → tap <span className="text-gray-200 font-medium">3 Dots / Chat Name</span> → scroll to <span className="text-gray-200 font-medium">More / Export Chat</span> → Select <span className="text-gray-200 font-medium">WITHOUT MEDIA</span>. Copy and paste the resulting text content above.
                </p>
              </div>
            </div>
          </div>

          {/* Server-Side Securing Panel */}
          <div className="mb-6 pt-4 border-t border-[#2A2A2A]">
            <div className="bg-[#080808]/80 border border-[#2A2A2A] rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 leading-relaxed select-none">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 tracking-wide uppercase text-[10px]">Secure Server-Side Execution</p>
                  <p className="text-slate-400 mt-0.5 font-sans">Your conversation records are processed confidentially on our dedicated servers utilizing the Gemini-3.5-Flash model.</p>
                </div>
              </div>
              <span className="shrink-0 bg-emerald-500/15 text-emerald-400 text-[9px] px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-emerald-500/10">Active Protection</span>
            </div>
          </div>

          {/* Error Prompt */}
          {errorStatus && (
            <div className="mb-6 p-4 bg-red-950/60 border border-red-500/30 text-red-300 text-sm rounded-lg flex items-start gap-2 animate-pulse" id="error-box">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <p>{errorStatus}</p>
            </div>
          )}

          {/* Action Trigger in IMMERSIVE UI style (White bold with red accent hover) */}
          <button
            onClick={handleAnalyzeChat}
            disabled={isAnalyzing}
            className={`w-full py-4 text-black font-bold uppercase tracking-widest text-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              isAnalyzing 
                ? "bg-[#252525] border border-[#3a3a3a] text-slate-500 cursor-not-allowed" 
                : "bg-white hover:bg-[#FF4444] hover:text-white"
            }`}
            id="analyze-button"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#FF4444]" />
            ) : (
              <Gavel className="w-4 h-4" />
            )}
            {isAnalyzing ? "Processing Chat Export..." : "Judge & Expose Participants"}
          </button>

          {/* Analyzing Loading Visual overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#0D0D0DD0] rounded-xl flex flex-col items-center justify-center gap-5 z-20 backdrop-blur-xs">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#2A2A2A] border-t-[#FF4444] rounded-full animate-spin" />
                <Gavel className="w-6 h-6 text-red-500 absolute top-5 left-5 animate-pulse" />
              </div>
              <div className="text-center px-4 max-w-sm">
                <p className="text-lg font-heading text-white font-semibold tracking-wide">
                  {LOADING_MESSAGES[loadingIndex]}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-widest text-[9px]">
                  Evaluating conversations in pipeline...
                </p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 3. RESULTS SECTION */}
      {analysisResult && (
        <section ref={resultsSectionRef} className="max-w-6xl w-full mx-auto px-4 py-8 scroll-mt-6" id="results-section">
          
          <div className="text-center mb-12">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2 select-none">AI Diagnosis Audit report</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
              <Gavel className="w-8 h-8 text-red-500" /> Executive Verdict
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mt-2 text-xs md:text-sm font-heading leading-relaxed">
              The gavel has fallen. Here is the objective, brutally honest personality assessment of your chat logs.
            </p>
          </div>

          {/* QUICK DOSSIER SHORTCUT BAR */}
          <div className="bg-[#111111] border-2 border-red-500/30 dark:border-red-500/20 rounded-xl p-4 md:p-5 mb-10 shadow-lg shadow-red-500/5 select-none relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-2 bg-gradient-to-b from-red-500 to-amber-500 h-full"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="pl-1">
                <span className="text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-widest font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"></span>
                  Dossier Control Room
                </span>
                <h3 className="text-xs font-bold text-white dark:text-zinc-100 uppercase tracking-wider font-heading mt-0.5 flex items-center gap-2">
                  <span>Quick Navigation Anchors</span>
                  <span className="text-[8px] bg-red-500/10 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-black tracking-widest font-mono select-none">
                    FAST JUMP ⚡
                  </span>
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Judicial Superlative Award */}
                <button
                  onClick={() => scrollToId("superlatives-section")}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:dark:text-amber-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Judicial Awards</span>
                </button>

                {/* Comparative radar map overlay */}
                {analysisResult.persons.length > 1 && (
                  <button
                    onClick={() => scrollToId("radar-comparison-card")}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 hover:text-rose-800 hover:dark:text-rose-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>Comparative Radar</span>
                  </button>
                )}

                {/* whatsapp chat analytics */}
                {chatAnalytics && chatAnalytics.personas.length > 0 && (
                  <button
                    onClick={() => scrollToId("chat-metadata-analytics")}
                    className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 hover:dark:text-indigo-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Chat Analytics</span>
                  </button>
                )}

                {/* Relationshop report */}
                <button
                  onClick={() => scrollToId("relationship-audit-card")}
                  className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:dark:text-emerald-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Relationship Report</span>
                </button>

                {/* who should apologize first ? */}
                {analysisResult.apologyVerdict && (
                  <button
                    onClick={() => scrollToId("apology-verdict-card")}
                    className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-400 hover:text-rose-800 hover:dark:text-rose-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Scale className="w-3.5 h-3.5 text-rose-500" />
                    <span>Who Apologizes First?</span>
                  </button>
                )}

                {/* relationship improvement council */}
                {analysisResult.relationshipAdvice && (
                  <button
                    onClick={() => scrollToId("relationship-advice-card")}
                    className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-400 hover:text-teal-800 hover:dark:text-teal-300 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Heart className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                    <span>Improvement Council</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC SUPERLATIVES BAR */}
          {(() => {
            const getHighest = (traitKey: "toxicity" | "ego" | "love" | "coldness") => {
              if (!analysisResult.persons || !analysisResult.persons.length) return null;
              let bestPerson = analysisResult.persons[0];
              let maxScore = bestPerson.scores[traitKey] ?? 0;
              for (const p of analysisResult.persons) {
                const s = p.scores[traitKey] ?? 0;
                if (s > maxScore) {
                  maxScore = s;
                  bestPerson = p;
                }
              }
              return { person: bestPerson, score: maxScore };
            };

            const flameItem = getHighest("toxicity");
            const egoItem = getHighest("ego");
            const careItem = getHighest("love");
            const iceItem = getHighest("coldness");

            const awards = [
              {
                title: "The Flame Thrower",
                description: "Highest toxicity and emotional damage index in the chat logs.",
                emoji: "☠️",
                border: "border-red-500/20 md:hover:border-red-500/40",
                bg: "bg-red-500/5",
                color: "text-red-400 text-shadow-glow",
                data: flameItem
              },
              {
                title: "Main Character Energy",
                description: "Highest ego and conversational gravity score recorded.",
                emoji: "👑",
                border: "border-orange-500/20 md:hover:border-orange-500/40",
                bg: "bg-orange-500/5",
                color: "text-orange-400",
                data: egoItem
              },
              {
                title: "The Ice Sculpture",
                description: "Unmatched level of dry replies, emotional absence, and late-delayed responses.",
                emoji: "🧊",
                border: "border-sky-500/20 md:hover:border-sky-500/40",
                bg: "bg-sky-500/5",
                color: "text-sky-400",
                data: iceItem
              },
              {
                title: "The Beacon of Care",
                description: "Highest affectionate, supportive language, and emotional care indicators.",
                emoji: "💖",
                border: "border-emerald-500/20 md:hover:border-emerald-500/40",
                bg: "bg-emerald-500/5",
                color: "text-emerald-400",
                data: careItem
              }
            ].filter(a => a.data && a.data.score > 25);

            if (!awards.length) return null;

            return (
              <div id="superlatives-section" className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 md:p-6 mb-12 shadow-2xl relative overflow-hidden select-none scroll-mt-24">
                <div className="absolute top-0 right-0 p-4 opacity-5 max-w-[120px] pointer-events-none text-[#FF4444]">
                  <Award className="w-24 h-24 stroke-[1.5]" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest font-mono">Dynamic Superlatives & Awards</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1 font-heading">Judicial Superlative Awards</h3>
                <p className="text-slate-400 text-xs mb-6 font-heading">
                  Determined dynamically by evaluating individual behavioral records across every submitted chat line.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {awards.map((awr) => {
                    if (!awr.data) return null;
                    const pName = awr.data.person.name;
                    return (
                      <div 
                        key={awr.title} 
                        className={`p-4 rounded-lg border ${awr.border} ${awr.bg} flex flex-col justify-between transition-all duration-300`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className="text-xl">{awr.emoji}</span>
                            <span className={`text-[10px] font-mono font-bold tracking-wider ${awr.color} uppercase bg-black/40 px-2 py-0.5 rounded border border-[#2a2a2a]`}>
                              Score: {awr.data.score}%
                            </span>
                          </div>
                          <h4 className="text-xs md:text-sm font-bold text-slate-100 font-heading mb-1">{awr.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal font-sans">{awr.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Crowned:</span>
                          <span className="text-xs font-black text-white tracking-tight">{pName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Participant Mesh */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {analysisResult.persons.map((person) => {
              const themeColor = activeColorMap[person.name] || "#FF4444";
              
              return (
                <div 
                  key={person.name} 
                  className="bg-[#161616] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative p-5 transition hover:border-slate-800"
                  style={{ borderTop: `4px solid ${themeColor}` }}
                  id={`person-card-${person.name.toLowerCase()}`}
                >
                  
                  {/* Dynamic absolute styled Immersive avatar corner widget */}
                  <div className="absolute top-4 right-4">
                    <div 
                      className="w-24 h-24 border rounded-full flex items-center justify-center select-none"
                      style={{ borderColor: `${themeColor}20` }}
                    >
                      <div 
                        className="w-16 h-16 rounded-full border flex items-center justify-center text-xl font-bold font-heading"
                        style={{ backgroundColor: `${themeColor}10`, borderColor: `${themeColor}40`, color: themeColor }}
                      >
                        {person.name.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Header info */}
                  <div className="mb-6 pr-24">
                    <h2 className="text-2xl font-bold font-heading text-white">{person.name}</h2>
                    <span 
                      className="inline-block mt-1 px-3 py-1 text-xs font-bold rounded-full border shrink-0 font-sans"
                      style={{ backgroundColor: `${themeColor}20`, color: themeColor, borderColor: `${themeColor}30` }}
                    >
                      {person.verdict}
                    </span>
                  </div>

                  {/* Body Content Grid (Progress bars column and radar metrics) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
                    
                    {/* Progress sliders column */}
                    <div className="space-y-3.5">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-[#2A2A2A] pb-1 flex items-center gap-1.5 font-heading">
                        <TrendingUp className="w-3 h-3 text-slate-500" /> Psychology Scores
                      </div>

                      {(Object.keys(person.scores) as Array<keyof typeof TRAIT_CONFIG>).map((trait, tIdx) => {
                        const score = person.scores[trait] ?? 0;
                        const config = TRAIT_CONFIG[trait] || { label: trait, icon: "🔍", color: "bg-red-500", text: "text-red-400" };
                        
                        return (
                          <div key={trait} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider select-none">
                              <span className="text-slate-400 flex items-center gap-1">
                                <span>{config.icon}</span> <span>{config.label}</span>
                              </span>
                              <span className={config.text}>{score}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                              <ProgressBar score={score} colorClass={config.color} delay={tIdx * 80} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Radar Chart side */}
                    <div className="flex flex-col items-center justify-center p-2 h-full">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-[#2A2A2A] pb-1 w-full text-left mb-4 flex items-center gap-1.5 font-heading">
                        <Activity className="w-3.5 h-3.5 text-slate-500" /> Radar Trait Map
                      </div>
                      <div className="w-full relative flex items-center justify-center">
                        <RadarChart person={person} color={themeColor} theme={theme} />
                      </div>
                    </div>

                  </div>

                  {/* FLAG METRICS ENGINE (Red Flags 🚩 vs Green Flags 💚) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Red Flags Container */}
                    <div className="bg-[#120404]/40 border border-red-500/15 rounded-lg p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-red-500/10 pb-2 mb-2 select-none">
                          <span className="text-[10px] text-red-500 uppercase font-black tracking-widest font-mono flex items-center gap-1.5">
                            🚩 Red Flags Found
                          </span>
                          <span className="text-xs bg-red-500/15 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-black font-mono">
                            {(person.redFlags || []).length}
                          </span>
                        </div>
                        
                        {person.redFlags && person.redFlags.length > 0 ? (
                           <ul className="space-y-2 text-xs">
                             {person.redFlags.map((flag, idx) => (
                               <li key={idx} className="text-slate-300 leading-normal flex items-start gap-1.5">
                                 <span className="text-red-500 select-none shrink-0 font-bold mt-0.5">🚩</span>
                                 <span className="font-sans text-[11px]">{flag}</span>
                               </li>
                             ))}
                           </ul>
                        ) : (
                          <p className="text-[10px] text-zinc-600 font-mono italic">No critical red flags recorded.</p>
                        )}
                      </div>
                    </div>

                    {/* Green Flags Container */}
                    <div className="bg-[#041208]/40 border border-emerald-500/15 rounded-lg p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2 mb-2 select-none">
                          <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest font-mono flex items-center gap-1.5">
                            💚 Green Flags Found
                          </span>
                          <span className="text-xs bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black font-mono">
                            {(person.greenFlags || []).length}
                          </span>
                        </div>
                        
                        {person.greenFlags && person.greenFlags.length > 0 ? (
                          <ul className="space-y-2 text-xs">
                            {person.greenFlags.map((flag, idx) => (
                              <li key={idx} className="text-slate-300 leading-normal flex items-start gap-1.5">
                                <span className="text-emerald-500 select-none shrink-0 font-bold mt-0.5">💚</span>
                                <span className="font-sans text-[11px]">{flag}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-zinc-600 font-mono italic">No prominent positive behaviors highlighted.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evidence quoted blocks container */}
                  <div className="bg-[#0D0D0D] p-3 rounded border-l-2 mt-auto" style={{ borderColor: themeColor }}>
                    <p className="text-[10px] text-slate-500 italic mb-2 uppercase tracking-widest font-heading flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Dominant Prosecutorial Evidence
                    </p>
                    <div className="space-y-3">
                      {person.evidence && person.evidence.length > 0 ? (
                        person.evidence.map((ev, evIdx) => {
                          const traitLabel = TRAIT_CONFIG[ev.trait as keyof typeof TRAIT_CONFIG]?.label || ev.trait;
                          
                          return (
                            <div key={evIdx} className="border-t border-[#2A2A2A]/50 pt-2.5 first:border-0 first:pt-0">
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                                Trait citation: {traitLabel}
                              </p>
                              <p className="text-[11px] text-slate-200 leading-relaxed italic mb-1 pl-2 border-l border-white/10 font-serif">
                                "{ev.quote}"
                              </p>
                              <p className="text-[10px]" style={{ color: `${themeColor}d0` }}>
                                {ev.explanation}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-neutral-600 font-mono italic">No quoted citations generated by analysis model.</p>
                      )}
                    </div>
                  </div>

                  {/* SAVAGE ROAST MODE TOGGLER */}
                  <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex flex-col gap-3">
                    <button
                      onClick={() => setActiveRoast(prev => ({ ...prev, [person.name]: !prev[person.name] }))}
                      className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        activeRoast[person.name]
                          ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400 animate-pulse"
                          : "bg-[#181818] hover:bg-[#252525] text-red-500 border border-red-500/20"
                      }`}
                    >
                      <Flame className={`w-4 h-4 ${activeRoast[person.name] ? "fill-white text-white" : ""}`} />
                      {activeRoast[person.name] ? "Roast Mode Active 🔥" : "Savage Roast Mode ☠️"}
                    </button>

                    {activeRoast[person.name] && (
                      <div className="bg-[#120404] border border-red-500/30 rounded-lg p-3.5 relative overflow-hidden shadow-inner shadow-red-900/10">
                        {/* Little absolute aesthetic lights */}
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75 m-2"></div>
                        <div className="flex items-center gap-1.5 mb-2 border-b border-red-500/10 pb-1.5 font-mono">
                          <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                          <span className="text-[10px] text-red-400 uppercase tracking-widest font-black">
                            AI Savage Roast
                          </span>
                        </div>
                        <p className="text-[11.5px] text-orange-200 leading-relaxed font-sans first-letter:text-lg first-letter:font-black first-letter:text-red-400">
                          {person.roast || "Savage roast pipeline initialized. This subject has no registered behavioral vulnerabilities to exploit yet."}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Overlay Comparison Radar Chart Row */}
          {analysisResult.persons.length > 1 && (
            <div id="radar-comparison-card" className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 md:p-8 mb-12 shadow-2xl scroll-mt-24">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Comparative Insights</label>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2 font-heading">
                <Activity className="w-5.5 h-5.5 text-[#FF4444]" /> Comparative Radar Map overlay
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-2xl font-heading">
                Compare overall psychological parameters aligned side-by-side to easily identify dominant figures and passive responders in a single visual dashboard.
              </p>
              <div className="max-w-xl mx-auto">
                <ComparisonRadarChart persons={analysisResult.persons} colorMap={activeColorMap} theme={theme} />
              </div>
            </div>
          )}

          {/* WhatsApp Chat Analytics Dashboard */}
          {chatAnalytics && chatAnalytics.personas.length > 0 && (
            <div 
              className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-6 md:p-8 mb-12 shadow-2xl scroll-mt-24"
              id="chat-metadata-analytics"
            >
              <div className="flex items-center gap-2 mb-3 select-none">
                <BarChart2 className="w-5 h-5 text-[#FF4444]" />
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest font-mono">Chat Forensic Extraction</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2 font-heading">
                WhatsApp Chat Analytics 📊
              </h3>
              
              <p className="text-slate-400 text-xs mb-8 font-heading leading-relaxed max-w-2xl">
                Forensic statistics analyzed from raw message lines. Let's see who is carrying the conversation, who holds the crown for ghosting, and who has midnight owl syndrome.
              </p>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CARD 1: Message Volume comparison */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center justify-between">
                      <span>💬 Message Volume (Kaun Zyada Bolta Hai)</span>
                      <span className="text-[10px] text-[#FF4444] font-normal font-sans">Total: {chatAnalytics.totalMessages} texts</span>
                    </h4>

                    <div className="space-y-4">
                      {chatAnalytics.personas.map((person) => {
                        const pct = chatAnalytics.totalMessages > 0 
                          ? Math.round((person.messageCount / chatAnalytics.totalMessages) * 100) 
                          : 0;
                        const pColor = activeColorMap[person.name] || "#FF4444";
                        
                        return (
                          <div key={person.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                                {person.name}
                              </span>
                              <span className="text-slate-400 font-mono font-medium">
                                {person.messageCount} texts ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#1b1b1b] h-3.5 rounded-full overflow-hidden border border-[#2d2d2d] flex p-[2px]">
                              <div 
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%`, backgroundColor: pColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Verdict text */}
                  {(() => {
                    const sorted = [...chatAnalytics.personas].sort((a, b) => b.messageCount - a.messageCount);
                    if (sorted.length < 2) return null;
                    const diff = sorted[0].messageCount - sorted[1].messageCount;
                    const wordyOne = sorted[0].name;
                    return (
                      <p className="text-[11px] text-slate-500 font-mono italic mt-6 border-t border-[#222222] pt-3">
                        💡 <span className="text-amber-400 font-semibold">{wordyOne}</span> dominates the talk pipeline with <span className="text-amber-400">{diff} more</span> messages than {sorted[1].name}. Standard definition of conversational volume.
                      </p>
                    );
                  })()}
                </div>

                {/* CARD 2: Conversation Starters */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center gap-1.5">
                      <span>🚀 Starter Tracker (Kaun Paehle Message Karta Hai)</span>
                    </h4>

                    <div className="space-y-4">
                      {chatAnalytics.personas.map((person) => {
                        const pColor = activeColorMap[person.name] || "#FF4444";
                        return (
                          <div key={person.name} className="flex items-center justify-between bg-[#191919] p-3 rounded-lg border border-[#2a2a2a]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                              <span className="text-xs font-bold text-white">{person.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black text-amber-500 font-mono">
                                {person.conversationStarters}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-wider bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                                Starter{person.conversationStarters !== 1 && "s"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const sorted = [...chatAnalytics.personas].sort((a, b) => b.conversationStarters - a.conversationStarters);
                    if (sorted.length < 2) return null;
                    if (sorted[0].conversationStarters === sorted[1].conversationStarters) {
                      return (
                        <p className="text-[11px] text-slate-500 font-mono italic mt-6 border-t border-[#222222] pt-3">
                          🤝 Both parties initiate chats equally. Balanced communication drive detected.
                        </p>
                      );
                    }
                    return (
                      <p className="text-[11px] text-slate-500 font-mono italic mt-6 border-t border-[#222222] pt-3">
                        💡 <span className="text-amber-400 font-semibold">{sorted[0].name}</span> initiates conversation {sorted[0].conversationStarters} times. Clearly holding higher conversational investment.
                      </p>
                    );
                  })()}
                </div>

                {/* CARD 3: Response Time and Ghosting Indicator */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>⏳ Average Response Time (Ghosting Indicator)</span>
                    </h4>

                    <div className="space-y-4">
                      {chatAnalytics.personas.map((person) => {
                        const pColor = activeColorMap[person.name] || "#FF4444";
                        return (
                          <div key={person.name} className="p-3 bg-[#171717] rounded-lg border border-[#252525] space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                                {person.name}
                              </span>
                              <span className="text-xs bg-black px-2 py-0.5 border border-[#333] rounded font-mono text-emerald-400 font-bold">
                                {person.avgResponseTimeMin === 0 ? "No turns recorded" : `${person.avgResponseTimeMin} min avg`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">Status:</span>
                              <span className="text-[11px] font-black font-sans uppercase tracking-tight text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-500/10 rounded">
                                {person.ghostingStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CARD 4: Time of Day Patterns (Late Night Owls) */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>🌙 Midnight Owls (Raat ke 2 Baje Messages 👀)</span>
                    </h4>

                    <div className="space-y-4">
                      {chatAnalytics.personas.map((person) => {
                        const pColor = activeColorMap[person.name] || "#FF4444";
                        const hasOwlSyndrome = person.timeDistribution.lateNight > 2;
                        return (
                          <div key={person.name} className="flex items-center justify-between bg-[#191919] p-3 rounded-lg border border-[#2a2a2a]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                                <span className="text-xs font-bold text-white">{person.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Morning: {person.timeDistribution.morning} | Aft: {person.timeDistribution.afternoon} | Eve: {person.timeDistribution.evening}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg font-black text-indigo-400 font-mono">
                                  {person.timeDistribution.lateNight}
                                </span>
                                <span className="text-[10px] text-slate-400">texts</span>
                              </div>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest ${hasOwlSyndrome ? "bg-purple-950/40 border border-purple-500/20 text-purple-400 animate-pulse" : "bg-[#222] border border-[#333] text-slate-500"}`}>
                                {hasOwlSyndrome ? "Raat ka Aashiq 👀" : "Normal Sleep"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CARD 5: Linguistic Fingerprints (Most Used Words) */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center gap-1.5">
                    <span>🗣️ Linguistic Fingerprint (Most Used Words)</span>
                  </h4>

                  <div className="space-y-4">
                    {chatAnalytics.personas.map((person) => {
                      const pColor = activeColorMap[person.name] || "#FF4444";
                      return (
                        <div key={person.name} className="space-y-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 rounded-full h-4" style={{ backgroundColor: pColor }} />
                            {person.name}'s Top Vocabulary:
                          </span>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {person.topWords.length > 0 ? (
                              person.topWords.map(({ word, count }) => (
                                <span 
                                  key={word} 
                                  className="text-[11px] bg-[#1a1a1a] border border-[#333] hover:border-[#444] px-2.5 py-1 rounded-full text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <span className="text-amber-500 italic">"{word}"</span>
                                  <span className="text-[9px] bg-[#222] text-slate-400 px-1.5 py-0.2 rounded font-black font-mono border border-[#303030]">
                                    {count}x
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-mono italic">No unique vocabulary matches found.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CARD 6: Emoji Distribution */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono flex items-center gap-1.5">
                    <span>😀 Emoji Distribution (Most Used Emotions)</span>
                  </h4>

                  <div className="space-y-4">
                    {chatAnalytics.personas.map((person) => {
                      const pColor = activeColorMap[person.name] || "#FF4444";
                      return (
                        <div key={person.name} className="space-y-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 rounded-full h-4" style={{ backgroundColor: pColor }} />
                            {person.name}'s Vibes (Total {person.emojiCount} emojis):
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {person.emojis.length > 0 ? (
                              person.emojis.map(({ emoji, count }) => (
                                <span 
                                  key={emoji} 
                                  className="text-sm bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg text-slate-200 flex items-center gap-1.5 select-none"
                                >
                                  <span className="text-lg">{emoji}</span>
                                  <span className="text-[9px] font-black text-slate-400 font-mono">
                                    {count}x
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-mono italic bg-[#151515] border border-[#222] px-2 py-1 rounded flex items-center gap-1">
                                🌵 Completely Dry (No Emojis Used)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3c. Relationship Health Verdict Card styled to exactly match the theme layout */}
          {(() => {
            const relLabel = analysisResult.relationship.label.toLowerCase();
            const relScore = analysisResult.relationship.score;
            const isToxic = relLabel === "toxic" || relScore < 35;
            const isComplicated = relLabel === "complicated" || (relScore >= 35 && relScore < 65);
            const relColor = isToxic ? "#FF4444" : isComplicated ? "#FFB800" : "#22C55E";
            
            return (
              <div 
                className="bg-[#161616] rounded-xl p-6 shadow-2xl relative border border-[#2A2A2A] scroll-mt-24"
                style={{ borderTop: `4px solid ${relColor}` }}
                id="relationship-audit-card"
              >
                <div className="flex flex-col md:flex-row items-start gap-6">
                  
                  {/* Left Side Score Indicator */}
                  <div className="flex flex-col items-center bg-[#212121] px-6 py-4 rounded-lg border border-[#333] shrink-0 min-w-[120px] justify-center select-none shadow-md">
                    <span className="text-4xl font-black font-heading tracking-tight" style={{ color: relColor }}>
                      {analysisResult.relationship.score}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
                  </div>

                  {/* Right Side summary block */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold font-heading text-white uppercase tracking-wider">
                        Relationship Report: <span style={{ color: relColor }}>{analysisResult.relationship.label}</span>
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-3xl font-heading">
                      {analysisResult.relationship.summary}
                    </p>

                    {/* Status Advice banner */}
                    <div className="mt-4 flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-slate-500 font-heading">
                      {isToxic ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/20 border border-red-900/30 text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Immediate boundaries recommended.
                        </span>
                      ) : isComplicated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/20 border border-amber-900/30 text-amber-400">
                          <Meh className="w-3.5 h-3.5 shrink-0" /> Restrictive conversational buffers suggested.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/30 text-emerald-400">
                          <Smile className="w-3.5 h-3.5 shrink-0" /> High-frequency cooperation parameters.
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}



          {/* 3d. Who Should Apologize First? Board */}
          {analysisResult.apologyVerdict && (
            <div 
              className="bg-[#161616] rounded-xl p-6 md:p-8 shadow-2xl relative border border-[#2A2A2A] mt-8 overflow-hidden scroll-mt-24"
              id="apology-verdict-card"
            >
              {/* Decorative background scale */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-amber-500">
                <Scale className="w-28 h-28 stroke-[1]" />
              </div>

              <div className="flex items-center gap-2 mb-3 select-none">
                <Scale className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest font-mono">Arbitration & Conflict Resolution</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2 font-heading">
                Who Should Apologize First? ⚖️
              </h3>
              
              <p className="text-slate-400 text-xs mb-6 font-heading leading-relaxed max-w-2xl">
                Our neural courtroom evaluated behavioral weights, defensive reaction timestamps, and emotional gaslighting ratios to formulate an objective, logical peace-restoring verdict.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Dynamic Apology Crown Badge */}
                <div className="md:col-span-1 bg-[#121212] border border-[#2c2c2c] rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden shadow-inner">
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>

                  <span className="text-4xl mb-3 animate-bounce select-none">👑</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Crowned Accused</span>
                  
                  {(() => {
                    const name = analysisResult.apologyVerdict?.shouldApologizeFirst || "N/A";
                    const isBoth = name.toLowerCase() === "both" || name.toLowerCase().includes("both");
                    const isNeither = name.toLowerCase() === "neither" || name.toLowerCase().includes("neither");
                    
                    if (isBoth) {
                      return (
                        <span className="text-lg font-black text-amber-400 uppercase tracking-tight font-heading leading-tight bg-amber-500/5 px-4 py-1.5 rounded-lg border border-amber-500/10">
                          Both Parties
                        </span>
                      );
                    }
                    if (isNeither) {
                      return (
                        <span className="text-lg font-black text-slate-400 uppercase tracking-tight font-heading leading-tight bg-[#222] px-4 py-1.5 rounded-lg border border-slate-700/30">
                          Neither Party
                        </span>
                      );
                    }
                    return (
                      <span className="text-lg font-black text-rose-500 uppercase tracking-tight font-heading leading-tight bg-rose-500/5 px-4 py-1.5 rounded-lg border border-rose-500/10">
                        {name}
                      </span>
                    );
                  })()}

                  <p className="text-[10px] text-slate-400 mt-3 font-medium font-mono tracking-wide uppercase">
                    Required to initiate peace
                  </p>
                </div>

                {/* Reasoning and Text breakdown */}
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-[#1D1D1D] border border-[#2d2d2d] rounded-xl p-5 relative">
                    <div className="text-[10px] text-amber-500 uppercase font-black tracking-wider border-b border-[#2d2d2d] pb-2 mb-3 font-mono flex items-center gap-1.5">
                      <span>🧠</span> Logical Reasoning Model Breakdown:
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans first-letter:text-xl first-letter:font-extrabold first-letter:text-amber-500">
                      {analysisResult.apologyVerdict?.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3e. AI Relationship Advice & Improvement Board */}
          {analysisResult.relationshipAdvice && (
            <div 
              className="bg-[#111612] rounded-xl p-6 md:p-8 shadow-2xl relative border border-emerald-900/40 mt-8 overflow-hidden scroll-mt-24"
              id="relationship-advice-card"
            >
              {/* Decorative abstract green glow circles */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-emerald-500">
                <Heart className="w-28 h-28 stroke-[1]" />
              </div>
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 select-none">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest font-mono">Healing & Reconciliation Strategy</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2 font-heading flex items-center gap-2">
                Relationship Improvement Council 🌱
              </h3>
              
              <p className="text-emerald-400/60 text-xs mb-6 font-heading leading-relaxed max-w-2xl">
                The jury has roasted, but empathy wins. Below are hyper-tailored advice steps and healing actions formulated to correct communication gaps and rebuild team alignment.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action steps */}
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-[10px] text-[#A6AFB8] uppercase font-bold tracking-widest block font-mono">Actionable Milestones</span>
                  <div className="space-y-3">
                    {analysisResult.relationshipAdvice.actionableSteps.map((step, idx) => (
                      <div 
                        key={idx}
                        className="bg-[#0B0D0B] border border-emerald-950/40 rounded-xl p-4 flex items-start gap-4 hover:border-emerald-500/20 transition-all duration-300"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/10">
                          0{idx + 1}
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Couple Challenge card */}
                <div className="lg:col-span-1">
                  <span className="text-[10px] text-[#A6AFB8] uppercase font-bold tracking-widest block font-mono mb-4">Therapeutic Duo Pact</span>
                  <div className="bg-gradient-to-br from-[#121a14] to-[#0a120c] border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden shadow-lg h-full flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/10">
                        <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
                      </div>
                      <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider mb-2">Teamwork Healing Challenge</h4>
                      <p className="text-xs text-emerald-200/90 leading-relaxed font-serif italic">
                        "{analysisResult.relationshipAdvice.coupleChallenge}"
                      </p>
                    </div>

                    <div className="mt-6 border-t border-emerald-950/40 pt-4 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-widest">Recommended Duration</span>
                      <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono">48 Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clean reload buttons */}
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => {
                setChatText("");
                setAnalysisResult(null);
                scrollTo(inputSectionRef);
              }}
              className="px-6 py-3 bg-[#111111] hover:bg-slate-900 text-slate-300 border border-[#2A2A2A] rounded-lg transition text-xs uppercase tracking-widest font-bold font-heading cursor-pointer"
              id="clear-results-btn"
            >
              Analyze Another Chat log
            </button>
          </div>

        </section>
      )}

      {/* FOOTER IN IMMERSIVE UI THEME STYLE */}
      <footer className="px-6 md:px-8 py-4 bg-[#080808] border-t border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-600 uppercase tracking-widest font-medium gap-4 mt-20 select-none">
        <div>© 2026 CHATJUDGE SYSTEMS</div>
        <div className="flex gap-4 md:gap-6 flex-wrap justify-center items-center">
          {analysisResult && (
            <>
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="hover:text-amber-500 text-slate-400 font-bold flex items-center gap-1.5 transition-colors uppercase tracking-widest font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>{isExportingPDF ? "Generating Report..." : "Forensic PDF"}</span>
              </button>
              <span className="text-zinc-800 select-none">|</span>
              <button
                onClick={handleShareReport}
                disabled={isSharing}
                className="hover:text-amber-500 text-slate-400 font-bold flex items-center gap-1.5 transition-colors uppercase tracking-widest font-mono cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{isSharing ? "Generating Link..." : "Public Link & QR"}</span>
              </button>
              <span className="text-zinc-800 select-none">|</span>
            </>
          )}
          <a href="https://faq.whatsapp.com/1180414079177245/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">How to export Chat</a>
          <span className="text-zinc-800 select-none">|</span>
          <button
            onClick={() => setShowSecurityModal(true)}
            className="hover:text-white transition-colors cursor-pointer uppercase font-medium bg-transparent border-none p-0 outline-none"
          >
            Security Protocol
          </button>
        </div>
      </footer>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in animate-duration-300">
          <div className="bg-[#111111] border border-amber-500/20 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Header style */}
            <div className="bg-amber-500/10 border-b border-[#2A2A2A] px-6 py-4 flex items-center justify-between">
              <span className="font-heading font-black text-amber-400 uppercase tracking-widest text-xs flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-500 animate-pulse" />
                Public share registered
              </span>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors uppercase font-mono tracking-widest text-[9px] hover:scale-105 cursor-pointer font-bold border border-[#2A2A2A] px-2 py-0.5 rounded"
              >
                [ ESC // CLOSE ]
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 flex flex-col items-center">
              <p className="text-xs text-slate-400 leading-relaxed text-center mb-6">
                This forensic verdict dossier is now published and accessible. Share the live URL or the scanned QR code below with friends to let them read the evaluation.
              </p>

              {/* QR Code Canvas Frame */}
              <div className="p-2.5 bg-white rounded-xl border-4 border-[#2A2A2A] shadow-xl relative group mb-6 transition-transform duration-300 hover:scale-[1.02]">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Verdict QR Code" className="w-[180px] h-[180px] select-all grayscale-0 transition-all" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-[180px] h-[180px] bg-zinc-900 animate-pulse rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">LOADING QR CODE...</div>
                )}
              </div>

              {/* URL address block */}
              <div className="w-full flex gap-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-1.5 items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-nowrap pl-2 max-w-[240px] select-all uppercase scrollbar-none">
                  {shareUrl}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest select-none flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedLink ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-amber-500 hover:bg-amber-400 text-black"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[9px] font-mono text-slate-600 uppercase text-center mt-2">
                SECURE PUBLIC HANDSHAKE: EXPOSURE ACTIVE
              </div>
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div 
          onClick={() => setShowSecurityModal(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in animate-duration-300 select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0E0E0E] border border-red-500/30 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative pointer-events-auto select-text my-8"
          >
            
            {/* Header */}
            <div className="bg-red-500/10 border-b border-[#2A2A2A] px-6 py-4 flex items-center justify-between">
              <span className="font-heading font-black text-red-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500 animate-pulse" />
                CHATSENTRY SECURITY PROTOCOLS [SECURE-MODE]
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSecurityModal(false);
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors uppercase font-mono tracking-widest text-[9px] hover:scale-105 cursor-pointer font-bold border border-[#2A2A2A] px-2 py-0.5 rounded outline-none"
              >
                [ ESC // CLOSE ]
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-white text-xs font-black uppercase font-mono tracking-widest text-red-400/80 mb-1">
                    PRIVACY FIRST FORENSIC INSPECTION
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    ChatJudge Systems enforces multi-layered encryption, immediate garbage disposal, and client-side sanitization policies to guarantee clinical confidentiality.
                  </p>
                </div>

                <div className="space-y-4 border-t border-[#2A2A2A] pt-4">
                  {/* Point 1 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-red-950/40 text-red-400 flex items-center justify-center shrink-0 border border-red-900/30 font-mono text-[10px] font-bold">
                      01
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold uppercase tracking-wider">Zero Database Log Retention</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Raw chat text is processed on-the-fly inside volatile server memory and never saved to databases or log pools permanently. It undergoes immediate automated virtual shredding.
                      </p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-red-950/40 text-red-400 flex items-center justify-center shrink-0 border border-red-900/30 font-mono text-[10px] font-bold">
                      02
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold uppercase tracking-wider">Identity Scrubbing & Masking</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Sensitive identifiers—such as personal phone contact numbers, private emails, residential addresses, and exact timestamps—are pre-scrubbed or masked prior to AI model vectorization.
                      </p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-red-950/40 text-red-400 flex items-center justify-center shrink-0 border border-red-900/30 font-mono text-[10px] font-bold">
                      03
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold uppercase tracking-wider">Public Share Verification (SHA-256 Nonces)</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        When you voluntarily publish a shared link, the verdict is signed using a high-entropy cryptographically secure unique identifier that prevents crawling, automated indexers, or URL guessing.
                      </p>
                    </div>
                  </div>

                  {/* Point 4 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-red-950/40 text-red-400 flex items-center justify-center shrink-0 border border-red-900/30 font-mono text-[10px] font-bold">
                      04
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold uppercase tracking-wider">Isolated Inference Architecture</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Our model requests run in dedicated, secure virtual sandboxes. They are fully compliant and zero training data feedback is sent to telemetry vectors.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111]/80 border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-2.5 mt-6">
                  <Lock className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <div className="text-[10px] text-white font-bold uppercase tracking-wider">Secure SSL Tunnel Active</div>
                    <div className="text-[8px] text-slate-600 font-mono uppercase tracking-widest leading-none mt-0.5">256-bit AES Transit Handshake Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Staggered animated progress slider child component using standard CSS transition state
function ProgressBar({ score, colorClass, delay }: { score: number; colorClass: string; delay: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100 + delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div 
      className={`h-full rounded-full transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${colorClass}`} 
      style={{ width: `${animatedScore}%` }} 
    />
  );
}
