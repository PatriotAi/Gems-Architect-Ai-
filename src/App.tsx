/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Wand2, 
  Layout, 
  BrainCircuit, 
  Terminal,
  ChevronRight,
  Box,
  Mic,
  CornerDownLeft,
  Globe,
  Rocket,
  Fingerprint,
  RotateCcw,
  Network,
  Sliders,
  Briefcase,
  BookOpen,
  Plug,
  ChevronDown,
  Send,
  X,
  ExternalLink,
  Loader2,
  Cpu,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Smile,
  Settings,
  Wrench,
  MessageCircle,
  Cloud,
  CloudLightning,
  Search,
  MapPin,
  Image,
  Video,
  Music,
  User,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  FolderOpen,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// --- FIREBASE IMPORTS ---
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  signInAnonymously, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';

// --- CUSTOM COMPONENTS ---
import CreativeStudio from './components/CreativeStudio';
import MediaAnalyst from './components/MediaAnalyst';
import AgenticComplianceStudio from './components/AgenticComplianceStudio';

// --- TYPES ---
interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
}

interface CustomTool {
  name: string;
  desc: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- INITIAL DATA ---
const INITIAL_TREE: TreeNode[] = [
  { id: 'root-1', text: 'Аналіз вхідного запиту', children: [
    { id: 'sub-1', text: 'Перевірка контексту', children: [] }
  ]},
  { id: 'root-2', text: 'Вибір інструментів', children: [] }
];

// --- GEMINI CONFIG ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  // --- STATE ---
  const [mobileTab, setMobileTab] = useState<'core' | 'builder' | 'chat'>('builder');
  const [role, setRole] = useState("Універсальний Асистент");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("Українська");
  const [skills, setSkills] = useState("");
  const [logicTree, setLogicTree] = useState<TreeNode[]>(INITIAL_TREE);
  const [standardTool, setStandardTool] = useState("None");
  const [knowledgePlan, setKnowledgePlan] = useState("");
  const [externalModules, setExternalModules] = useState<string[]>([]);
  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [starters, setStarters] = useState<string[]>([]);
  const [gemIcon, setGemIcon] = useState("Sparkles");
  // --- STATE FOR NEW INTEGRATIONS ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedGems, setSavedGems] = useState<any[]>([]);
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isCloudGemsOpen, setIsCloudGemsOpen] = useState(false);

  const [simModel, setSimModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [highThinking, setHighThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [isVoiceResponseActive, setIsVoiceResponseActive] = useState(false);

  // Audio recording state for transcription (gemini-3.5-flash)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [omniInput, setOmniInput] = useState("");
  const [isProcessingOmni, setIsProcessingOmni] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [isGeneratingLogic, setIsGeneratingLogic] = useState(false);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'logic' | 'config' | 'media' | 'creative' | 'compliance'>('logic');
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Контекст завантажено. Я готовий емулювати роботу вашого Gems." }
  ]);
  const [simInput, setSimInput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  
  const simChatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- PERSISTENCE ---
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('gems_architect_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.role) setRole(data.role);
        if (data.tone) setTone(data.tone);
        if (data.language) setLanguage(data.language);
        if (data.skills) setSkills(data.skills);
        if (data.logicTree) setLogicTree(data.logicTree);
        if (data.standardTool) setStandardTool(data.standardTool);
        if (data.knowledgePlan) setKnowledgePlan(data.knowledgePlan);
        if (data.externalModules) setExternalModules(data.externalModules);
        if (data.customTools) setCustomTools(data.customTools);
        if (data.starters) setStarters(data.starters);
        if (data.gemIcon) setGemIcon(data.gemIcon);
      } catch (e) {
        console.error("Load Error:", e);
      }
    }
    const t = setTimeout(() => {
      isFirstRender.current = false;
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) return;

    setSaveStatus('saving');
    const handler = setTimeout(() => {
      try {
        const state = {
          role, tone, language, skills, logicTree, 
          standardTool, knowledgePlan, externalModules, 
          customTools, starters, gemIcon
        };
        localStorage.setItem('gems_architect_state', JSON.stringify(state));
        setSaveStatus('saved');
        
        // Return to idle after a short delay
        const idleTimer = setTimeout(() => {
          setSaveStatus('idle');
        }, 1500);
        return () => clearTimeout(idleTimer);
      } catch (e) {
        console.error("Auto-save error:", e);
      }
    }, 1000); // 1 second debounce - saves once user stops editing/typing

    return () => clearTimeout(handler);
  }, [role, tone, language, skills, logicTree, standardTool, knowledgePlan, externalModules, customTools, starters, gemIcon]);

  // --- EFFECTS ---
  useEffect(() => {
    if (simChatRef.current) {
      simChatRef.current.scrollTop = simChatRef.current.scrollHeight;
    }
  }, [simMessages]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'uk-UA';
      recognitionRef.current.onstart = () => setIsMicActive(true);
      recognitionRef.current.onend = () => setIsMicActive(false);
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setOmniInput(transcript);
        processOmniCommand(transcript);
      };
    }
  }, []);

  // --- AUTH AND DATABASE SUBSCRIPTIONS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (!usr) {
        setSavedGems([]);
        setSelectedGemId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'gems'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gems: any[] = [];
      snapshot.forEach((doc) => {
        gems.push({ id: doc.id, ...doc.data() });
      });
      setSavedGems(gems);
    }, (error) => {
      console.error("Firestore sync error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // --- LOGIN / LOGOUT HANDLERS ---
  const handleLoginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google auth failed, using anonymous auth as fallback:", error);
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Anonymous fallback failed:", err);
      }
    }
  };

  const handleLoginAnonymous = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous auth failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // --- CLOUD PERSISTENCE OPERATIONS ---
  const handleSaveGemToCloud = async () => {
    if (!user) return;
    setIsCloudSaving(true);
    try {
      const gemId = selectedGemId || `gem-${Date.now()}`;
      const gemData = {
        role,
        tone,
        language,
        skills,
        logicTree,
        standardTool,
        knowledgePlan,
        externalModules,
        customTools,
        starters,
        gemIcon,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'gems', gemId), gemData);
      setSelectedGemId(gemId);
    } catch (error) {
      console.error("Failed to save Gem:", error);
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleLoadGemFromCloud = (gem: any) => {
    setIsCloudLoading(true);
    try {
      setSelectedGemId(gem.id);
      if (gem.role) setRole(gem.role);
      if (gem.tone) setTone(gem.tone);
      if (gem.language) setLanguage(gem.language);
      if (gem.skills) setSkills(gem.skills);
      if (gem.logicTree) setLogicTree(gem.logicTree);
      if (gem.standardTool) setStandardTool(gem.standardTool);
      if (gem.knowledgePlan) setKnowledgePlan(gem.knowledgePlan);
      if (gem.externalModules) setExternalModules(gem.externalModules);
      if (gem.customTools) setCustomTools(gem.customTools);
      if (gem.starters) setStarters(gem.starters);
      if (gem.gemIcon) setGemIcon(gem.gemIcon);
      setIsCloudGemsOpen(false);
    } catch (error) {
      console.error("Failed to load Gem:", error);
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleDeleteGemFromCloud = async (gemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'gems', gemId));
      if (selectedGemId === gemId) {
        setSelectedGemId(null);
      }
    } catch (error) {
      console.error("Failed to delete Gem:", error);
    }
  };

  // --- AUDIO TRANSCRIPTION (GEMINI 3.5 FLASH) ---
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (error) {
      console.error("Error accessing mic for transcription:", error);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: base64data,
                mimeType: 'audio/webm'
              }
            },
            "Переклади це аудіо у текст максимально точно та лаконічно. Поверни ТІЛЬКИ розшифрований текст, без коментарів та вступних слів."
          ]
        });

        const transcript = response.text?.trim() || "";
        if (transcript) {
          setSimInput(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };
    } catch (error) {
      console.error("Error transcribing audio with Gemini:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  // --- AUDIO RESPONSE (TTS) FEEDBACK ---
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_\-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'Українська' ? 'uk-UA' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- PROMPT GENERATION ---
  const finalPrompt = useMemo(() => {
    let p = `### SYSTEM INSTRUCTIONS ###\n`;
    p += `ROLE: ${role}\nTONE: ${tone}\nLANGUAGE: ${language}\n\n`;
    p += `[INFRASTRUCTURE]\n- Standard Tool: ${standardTool}\n- Knowledge Plan: ${knowledgePlan ? "Included" : "None"}\n\n`;
    p += `[COMPETENCIES]\n${skills || "Навички не згенеровано."}\n\n`;
    p += `[TOOLS & PROTOCOLS]\n`;
    if (externalModules.includes('n8n_webhook')) p += `- n8n_WEBHOOK: JSON Payload Protocol\n`;
    if (externalModules.includes('google_sheets')) p += `- GOOGLE_SHEETS: CSV Protocol\n`;
    if (externalModules.includes('python_adv')) p += `- PYTHON: Data Analysis Protocol\n`;
    customTools.forEach(t => p += `- ${t.name}: ${t.desc}\n`);
    
    p += `\n[LOGIC TREE]\n`;
    const printTree = (nodes: TreeNode[], level = 0): string => {
      let s = "";
      nodes.forEach((n, i) => {
        s += `${"  ".repeat(level)}${i + 1}. ${n.text}\n`;
        if (n.children.length) s += printTree(n.children, level + 1);
      });
      return s;
    };
    p += printTree(logicTree);

    if (starters.length > 0) {
      p += `\n[CONVERSATION STARTERS]\n`;
      starters.forEach(s => p += `- ${s}\n`);
    }
    
    return p;
  }, [role, tone, language, skills, logicTree, standardTool, knowledgePlan, externalModules, customTools, starters]);

  // --- HANDLERS ---
  const toggleMic = () => {
    if (recognitionRef.current) {
      if (isMicActive) recognitionRef.current.stop();
      else recognitionRef.current.start();
    }
  };

  const processOmniCommand = async (text: string) => {
    if (!text.trim() || isProcessingOmni) return;
    setIsProcessingOmni(true);
    setOmniInput("");

    const prompt = `
    Analyze this command: "${text}".
    Determine intent:
    1. New Role (e.g. "Create Lawyer", "Створити маркетолога").
    2. Add Tool/Module (e.g. "Add Python", "Додати n8n", "Set Canvas tool").
    3. Language Change.
    4. Add Conversation Starter (e.g. "Add starter: How to start?", "Додай питання: З чого почати?").
    5. Set Icon (e.g. "Set icon to Brain", "Встанови іконку Робот").
    6. Reset (e.g. "Reset all", "Очистити все").
    
    Return JSON:
    {
        "action": "new_role" | "add_tool" | "add_starter" | "set_icon" | "reset",
        "roleName": "Extracted Role or null",
        "tools": ["n8n_webhook", "google_sheets", "python_adv"] (if standard external),
        "standardTool": "Deep Research" | "Canvas" | "Veo" | "Imagen" | "Code" | "None",
        "starter": "Extracted starter text or null",
        "icon": "Sparkles" | "BrainCircuit" | "Cpu" | "Globe" | "Briefcase" | "Rocket" | "Fingerprint" | "Terminal" | "Layout"
    }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      const intent = JSON.parse(response.text || "{}");

      if (intent.action === 'reset') {
        setRole("Універсальний Асистент");
        setTone("Professional");
        setSkills("");
        setLogicTree(INITIAL_TREE);
        setStandardTool("None");
        setKnowledgePlan("");
        setExternalModules([]);
        setCustomTools([]);
        setStarters([]);
        setGemIcon("Sparkles");
        return;
      }

      if (intent.action === 'new_role' && intent.roleName) {
        setRole(intent.roleName);
        generateSkills(intent.roleName);
      }
      
      if (intent.action === 'add_starter' && intent.starter) {
        setStarters(prev => [...prev, intent.starter]);
        setActiveTab('config');
      }

      if (intent.action === 'set_icon' && intent.icon) {
        setGemIcon(intent.icon);
      }

      if (intent.tools && intent.tools.length > 0) {
        setExternalModules(prev => Array.from(new Set([...prev, ...intent.tools])));
        setActiveTab('config');
      }

      if (intent.standardTool) {
        setStandardTool(intent.standardTool);
        setActiveTab('config');
      }
    } catch (e) {
      console.error("Omni Error:", e);
      setRole(text);
      generateSkills(text);
    } finally {
      setIsProcessingOmni(false);
    }
  };

  const generateSkills = async (roleName: string) => {
    setIsGeneratingSkills(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Generate expert skills for role: "${roleName}". Language: ${language}. Format: List, bullet points.` }] }],
      });
      setSkills(response.text || "");
    } catch (e) {
      console.error("Skills Error:", e);
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  const generateLogic = async () => {
    setIsGeneratingLogic(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Generate logic workflow for "${role}". Lang: ${language}. Format: JSON [{"text":"Step", "children":[]}]. No markdown.` }] }],
        config: { responseMimeType: "application/json" }
      });
      const json = JSON.parse(response.text || "[]");
      const addIds = (nodes: any[]): TreeNode[] => nodes.map((n, i) => ({ 
        id: `ai-${Date.now()}-${i}`, 
        text: n.text, 
        children: n.children ? addIds(n.children) : [] 
      }));
      setLogicTree(addIds(json));
    } catch (e) {
      console.error("Logic Error:", e);
    } finally {
      setIsGeneratingLogic(false);
    }
  };

  const generateKnowledgeSuggestions = async () => {
    setIsGeneratingKnowledge(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts: [{ text: `Suggest 3 file types to upload to Knowledge Base for "${role}". Format: "- [Type]: Reason".` }] }],
      });
      setKnowledgePlan(response.text || "");
    } catch (e) {
      console.error("Knowledge Error:", e);
    } finally {
      setIsGeneratingKnowledge(false);
    }
  };

  const runSimulation = async (overrideInput?: string) => {
    const inputToUse = overrideInput || simInput;
    if (!inputToUse.trim() || isSimulating) return;
    
    const userText = inputToUse.trim();
    if (!overrideInput) setSimInput("");
    
    const nextMessages = [...simMessages, { role: 'user' as const, text: userText }];
    setSimMessages(nextMessages);
    setIsSimulating(true);

    try {
      const modelToUse = simModel;
      
      const config: any = {
        systemInstruction: `SYSTEM INSTRUCTIONS:\n${finalPrompt}`
      };

      // Handle reasoning level for compatible models
      if (modelToUse === 'gemini-3.1-pro-preview' && highThinking) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH
        };
      } else {
        config.maxOutputTokens = 1200;
      }

      // Handle grounding tools
      const tools: any[] = [];
      if (useSearch) {
        tools.push({ googleSearch: {} });
      } else if (useMaps) {
        tools.push({ googleMaps: {} });
      }

      if (tools.length > 0) {
        config.tools = tools;
      }

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          ...nextMessages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        ],
        config: config
      });

      const reply = response.text || "";
      setSimMessages(prev => [...prev, { role: 'model', text: reply }]);

      if (isVoiceResponseActive && reply) {
        speakResponse(reply);
      }
    } catch (e) {
      console.error("Sim Error:", e);
      setSimMessages(prev => [...prev, { role: 'model', text: "Помилка симуляції. Перевірте API-ключ або налаштування заземлення." }]);
    } finally {
      setIsSimulating(false);
    }
  };

  // --- TREE HELPERS ---
  const updateNodeText = (id: string, text: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === id) return { ...n, text };
      if (n.children.length) return { ...n, children: update(n.children) };
      return n;
    });
    setLogicTree(update(logicTree));
  };

  const addChild = (id: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
      if (n.id === id) return { ...n, children: [...n.children, { id: `node-${Date.now()}`, text: '', children: [] }] };
      if (n.children.length) return { ...n, children: update(n.children) };
      return n;
    });
    setLogicTree(update(logicTree));
  };

  const deleteNode = (id: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] => nodes.filter(n => n.id !== id).map(n => ({
      ...n,
      children: update(n.children)
    }));
    setLogicTree(update(logicTree));
  };

  const moveNode = (id: string, direction: 'up' | 'down') => {
    const update = (nodes: TreeNode[]): TreeNode[] => {
      const idx = nodes.findIndex(n => n.id === id);
      if (idx !== -1) {
        const newNodes = [...nodes];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx >= 0 && targetIdx < newNodes.length) {
          [newNodes[idx], newNodes[targetIdx]] = [newNodes[targetIdx], newNodes[idx]];
        }
        return newNodes;
      }
      return nodes.map(n => ({ ...n, children: update(n.children) }));
    };
    setLogicTree(update(logicTree));
  };

  const addRootNode = () => {
    setLogicTree([...logicTree, { id: `root-${Date.now()}`, text: 'Новий етап', children: [] }]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const IconMap: Record<string, any> = {
    Sparkles, BrainCircuit, Cpu, Globe, Briefcase, Rocket, Fingerprint, Terminal, Layout, Box, Wand2, Sliders, Network, Plug, BookOpen, Mic
  };
  const SelectedIcon = IconMap[gemIcon] || Sparkles;

  return (
    <div className="h-screen flex flex-col bg-[#09090B] text-zinc-100 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-auto md:h-16 border-b border-zinc-800 bg-zinc-950 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-2 md:py-0 z-50 shrink-0 gap-2 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] shrink-0">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div className="hidden md:block">
              <h1 className="font-bold text-sm tracking-wider text-white">GEMS ARCHITECT <span className="text-violet-500">INTENT AI+</span></h1>
              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  SYSTEM ONLINE
                </div>
                {saveStatus !== 'idle' && (
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-px bg-zinc-800"></span>
                    {saveStatus === 'saving' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className={saveStatus === 'saving' ? 'text-amber-400' : 'text-emerald-400'}>
                      {saveStatus === 'saving' ? 'Збереження...' : 'Автозбережено'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile save status */}
            {saveStatus !== 'idle' && (
              <div className="flex md:hidden items-center gap-1 text-[10px] font-mono">
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
                <span className={saveStatus === 'saving' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {saveStatus === 'saving' ? 'Збереження...' : 'Збережено'}
                </span>
              </div>
            )}
          </div>
          {/* Mobile Actions */}
          <div className="flex md:hidden gap-2">
            <button 
              onClick={() => setIsBridgeModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OMNI-INPUT */}
        <div className="w-full md:flex-grow md:max-w-2xl md:mx-12 relative group">
          <input 
            type="text" 
            value={omniInput}
            onChange={(e) => setOmniInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processOmniCommand(omniInput)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 md:py-3 pl-10 pr-24 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-zinc-600 shadow-inner"
            placeholder="Напишіть: 'Створи бізнес-аналітика'..."
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button 
              onClick={toggleMic}
              className={`p-1.5 md:p-2 rounded-lg transition ${isMicActive ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={() => processOmniCommand(omniInput)}
              disabled={isProcessingOmni}
              className="px-2 md:px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition text-[10px] md:text-xs font-bold shadow-lg shadow-violet-900/40 flex items-center gap-1 md:gap-2 disabled:opacity-50"
            >
              {isProcessingOmni ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="hidden md:inline">EXECUTE</span>}
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex items-center gap-3">
          {/* Firestore Cloud Sync Panel */}
          {user ? (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 px-2">
              <button
                onClick={() => setIsCloudGemsOpen(true)}
                className="p-1 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition flex items-center gap-1.5 text-[11px] font-semibold"
                title="Відкрити збережені Gems"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Gems ({savedGems.length})</span>
              </button>
              <div className="h-4 w-px bg-zinc-800"></div>
              <button
                onClick={handleSaveGemToCloud}
                disabled={isCloudSaving}
                className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition flex items-center gap-1.5 text-[11px] font-semibold"
                title="Зберегти поточний Gem у Хмару"
              >
                {isCloudSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>Зберегти</span>
              </button>
              <div className="h-4 w-px bg-zinc-800"></div>
              <button
                onClick={handleLogout}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition"
                title="Вийти з хмари"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 px-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sync:</span>
              <button
                onClick={handleLoginGoogle}
                className="p-1 px-2 text-[11px] font-bold text-violet-400 hover:bg-zinc-800 rounded transition flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Увійти
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2 border border-zinc-800 min-w-[140px]">
            <Globe className="w-3 h-3 text-zinc-500" />
            <input 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-white border-none focus:ring-0 w-full py-1 outline-none" 
              placeholder="Мова..." 
            />
          </div>
          <button 
            onClick={() => setIsBridgeModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-900/20 flex items-center gap-2 transform hover:scale-105"
          >
            <Rocket className="w-3 h-3" /> Експорт Gem
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden pb-16 md:pb-0 relative">
        {/* LEFT: CONTEXT ENGINE */}
        <aside className={`md:col-span-3 border-r border-zinc-800 flex-col bg-zinc-950 h-full ${mobileTab === 'core' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <h2 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
              <Fingerprint className="w-4 h-4 text-violet-500" /> СУТНІСТЬ
            </h2>
            <div className="text-[9px] text-violet-400 font-mono">AI READY</div>
          </div>
          
          <div className="p-4 overflow-y-auto space-y-5 flex-grow scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-zinc-500 font-bold">Назва Gems</label>
              <input 
                type="text" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-bold text-violet-300 focus:border-violet-500 outline-none" 
              />
            </div>

            <div className="space-y-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase text-zinc-500 font-bold">Матриця Навичок</label>
                <button 
                  onClick={() => generateSkills(role)}
                  className="text-[10px] text-violet-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-2 h-2" /> Оновити
                </button>
              </div>
              <div className={`relative ${isGeneratingSkills ? 'after:content-[""] after:absolute after:inset-0 after:bg-violet-500/10 after:animate-pulse' : ''}`}>
                <textarea 
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full h-60 bg-zinc-950 border border-zinc-800 rounded p-3 text-[10px] leading-relaxed resize-none font-mono text-zinc-400 focus:border-violet-500 outline-none" 
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-zinc-500 font-bold">Тональність</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 focus:border-violet-500 outline-none"
              >
                <option value="Professional">Професійна & Експертна</option>
                <option value="Empathetic">Емпатична & Тепла</option>
                <option value="Sarcastic">Дотепна & Саркастична</option>
                <option value="Academic">Академічна & Сувора</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold">Іконка Gem</label>
              <div className="grid grid-cols-5 gap-2">
                {['Sparkles', 'BrainCircuit', 'Cpu', 'Globe', 'Briefcase', 'Rocket', 'Fingerprint', 'Terminal', 'Layout', 'Box'].map(iconName => {
                  const IconComp = IconMap[iconName];
                  return (
                    <button 
                      key={iconName}
                      onClick={() => setGemIcon(iconName)}
                      className={`p-2 rounded border transition-all ${gemIcon === iconName ? 'bg-violet-600 border-violet-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                    >
                      <IconComp className="w-4 h-4 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: CONFIG & LOGIC */}
        <section className={`md:col-span-5 bg-zinc-950 flex-col relative border-r border-zinc-800 h-full ${mobileTab === 'builder' ? 'flex' : 'hidden md:flex'}`}>
          {/* Navigation */}
          <div className="flex border-b border-zinc-800 bg-zinc-950 shrink-0 overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setActiveTab('logic')}
              className={`flex-1 min-w-[100px] py-3 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'logic' ? 'text-white border-violet-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
              <Network className="w-3.5 h-3.5" /> Логіка
            </button>
            <button 
              onClick={() => setActiveTab('config')}
              className={`flex-1 min-w-[100px] py-3 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'config' ? 'text-white border-violet-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
              <Sliders className="w-3.5 h-3.5" /> Інструменти
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`flex-1 min-w-[110px] py-3 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'media' ? 'text-white border-violet-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
              <Search className="w-3.5 h-3.5" /> Медіа-Аналітика
            </button>
            <button 
              onClick={() => setActiveTab('creative')}
              className={`flex-1 min-w-[110px] py-3 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'creative' ? 'text-white border-violet-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Creative Studio
            </button>
            <button 
              onClick={() => setActiveTab('compliance')}
              className={`flex-1 min-w-[125px] py-3 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'compliance' ? 'text-white border-violet-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Compliance & Guardrails
            </button>
          </div>

          {/* VIEW: LOGIC TREE */}
          {activeTab === 'logic' && (
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Алгоритм дій</span>
                <div className="flex gap-2">
                  <button 
                    onClick={generateLogic}
                    disabled={isGeneratingLogic}
                    className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/30 text-violet-300 border border-violet-600/20 rounded text-[10px] transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingLogic ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Suggest
                  </button>
                  <button 
                    onClick={addRootNode}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-[10px] transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Додати Етап
                  </button>
                </div>
              </div>
              <div className="space-y-1 pb-20 pl-2">
                {logicTree.map(node => (
                  <TreeNodeUI 
                    key={node.id} 
                    node={node} 
                    level={0} 
                    onUpdate={updateNodeText} 
                    onAddChild={addChild} 
                    onDelete={deleteNode} 
                    onMove={moveNode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 space-y-6">
              {/* 1. Standard Tool */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> 1. Google Standard Tool
                </h3>
                <div className="relative">
                  <select 
                    value={standardTool}
                    onChange={(e) => setStandardTool(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 appearance-none outline-none focus:border-emerald-500"
                  >
                    <option value="None">Kein Standardtool (Без інструменту)</option>
                    <option value="Deep Research">Deep Research (Глибинний пошук)</option>
                    <option value="Veo">Videos erstellen (Veo 3.1)</option>
                    <option value="Imagen">Bilder erstellen (Imagen 3)</option>
                    <option value="Canvas">Canvas (Кодинг/Письмо)</option>
                    <option value="Code">Code importieren</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* 2. Knowledge Base */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> 2. База Знань (Knowledge)
                </h3>
                <textarea 
                  value={knowledgePlan}
                  onChange={(e) => setKnowledgePlan(e.target.value)}
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-blue-500 resize-none" 
                  placeholder="Опишіть файли, які потрібно завантажити в розділ 'Wissen'..." 
                />
                <button 
                  onClick={generateKnowledgeSuggestions}
                  disabled={isGeneratingKnowledge}
                  className="mt-2 text-[10px] text-blue-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingKnowledge ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />} AI Підказка: Що завантажити?
                </button>
              </div>

              {/* 3. External Modules */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                  <Plug className="w-4 h-4" /> 3. Зовнішні Модулі
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['n8n_webhook', 'google_sheets', 'python_adv'].map(tool => (
                    <label key={tool} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={externalModules.includes(tool)}
                        onChange={(e) => {
                          if (e.target.checked) setExternalModules([...externalModules, tool]);
                          else setExternalModules(externalModules.filter(t => t !== tool));
                        }}
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-violet-600 focus:ring-violet-500" 
                      />
                      <span className="text-xs text-zinc-300 group-hover:text-purple-400 transition capitalize">{tool.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
                
                <div className="border-t border-zinc-800 pt-3 flex gap-2">
                  <input id="customToolName" className="flex-grow bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-violet-500" placeholder="Власний модуль" />
                  <input id="customToolDesc" className="flex-grow bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-violet-500" placeholder="Дія" />
                  <button 
                    onClick={() => {
                      const name = (document.getElementById('customToolName') as HTMLInputElement).value;
                      const desc = (document.getElementById('customToolDesc') as HTMLInputElement).value;
                      if (name && desc) {
                        setCustomTools([...customTools, { name, desc }]);
                        (document.getElementById('customToolName') as HTMLInputElement).value = '';
                        (document.getElementById('customToolDesc') as HTMLInputElement).value = '';
                      }
                    }}
                    className="px-3 bg-violet-600 hover:bg-violet-500 rounded text-white text-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {customTools.map((t, i) => (
                    <div key={i} className="text-[10px] text-zinc-400 bg-zinc-900 p-1 px-2 rounded border border-zinc-800 flex justify-between items-center">
                      <span>{t.name}: {t.desc}</span>
                      <button onClick={() => setCustomTools(customTools.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Conversation Starters */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-orange-400 uppercase mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> 4. Питання для старту (Starters)
                </h3>
                <div className="flex gap-2 mb-3">
                  <input 
                    id="newStarter" 
                    className="flex-grow bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-orange-500" 
                    placeholder="Наприклад: 'З чого нам почати?'" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          setStarters([...starters, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const el = document.getElementById('newStarter') as HTMLInputElement;
                      if (el.value) {
                        setStarters([...starters, el.value]);
                        el.value = '';
                      }
                    }}
                    className="px-3 bg-orange-600 hover:bg-orange-500 rounded text-white text-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {starters.map((s, i) => (
                    <div key={i} className="text-[10px] text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800 flex justify-between items-center group">
                      <span className="truncate pr-4">{s}</span>
                      <button onClick={() => setStarters(starters.filter((_, idx) => idx !== i))} className="text-zinc-600 hover:text-red-400 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MEDIA ANALYST */}
          {activeTab === 'media' && (
            <MediaAnalyst ai={ai} />
          )}

          {/* VIEW: CREATIVE STUDIO */}
          {activeTab === 'creative' && (
            <CreativeStudio ai={ai} role={role} />
          )}

          {/* VIEW: AGENTIC COMPLIANCE & GUARDRAILS */}
          {activeTab === 'compliance' && (
            <AgenticComplianceStudio 
              ai={ai} 
              role={role} 
              onInjectGuardrailsToGem={(instructions) => {
                setSkills(prev => prev ? prev + '\n\n' + instructions : instructions);
                setLogicTree(prev => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    text: "LLM Guardrails & EU AI Act 2026 Compliance",
                    children: [
                      { id: Date.now().toString() + '-1', text: "EU AI Act Art. 50 Mandatory Transparency Disclaimer", children: [] },
                      { id: Date.now().toString() + '-2', text: "Input/Output Guardrails (Jailbreak, PII Anonymization)", children: [] },
                      { id: Date.now().toString() + '-3', text: "GDPR Art. 22 Human Escalation & Warm Handoff", children: [] }
                    ]
                  }
                ]);
              }} 
            />
          )}
        </section>

        {/* RIGHT: PREVIEW & SIMULATION */}
        <aside className={`md:col-span-4 border-l border-zinc-800 flex-col bg-zinc-950 h-full ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          {/* Code Preview */}
          <div className="h-1/2 flex flex-col border-b border-zinc-800">
            <div className="p-2 bg-zinc-900 flex justify-between items-center border-b border-zinc-800 shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" /> LIVE_PROMPT_PREVIEW
              </span>
              <button 
                onClick={() => copyToClipboard(finalPrompt)}
                className="text-[9px] bg-zinc-800 hover:bg-white hover:text-black px-2 py-1 rounded transition uppercase font-bold"
              >
                Copy Code
              </button>
            </div>
            <textarea 
              value={finalPrompt}
              readOnly
              className="flex-grow bg-zinc-950 text-[10px] font-mono text-emerald-500/80 p-4 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-zinc-800" 
              spellCheck="false"
            />
          </div>

          {/* Simulation Chat */}
          <div className="flex-grow flex flex-col bg-zinc-950 overflow-hidden">
            <div className="p-2 bg-violet-900/10 border-b border-violet-500/20 flex justify-between items-center shrink-0">
              <h3 className="text-[10px] font-bold text-violet-300 flex items-center gap-2 uppercase tracking-widest">
                <Cpu className="w-3 h-3" /> AI SIMULATION (REAL-TIME)
              </h3>
              <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            </div>

            {/* Simulation Settings Toolbar */}
            <div className="bg-zinc-900/80 border-b border-zinc-800 p-2.5 space-y-2 text-[10px] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-zinc-500 font-bold uppercase">Model:</span>
                  <select
                    value={simModel}
                    onChange={(e: any) => {
                      setSimModel(e.target.value);
                      if (e.target.value !== 'gemini-3.1-pro-preview') {
                        setHighThinking(false);
                      }
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-300 flex-1 outline-none text-[10px]"
                  >
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Low latency)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Standard)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Expert Reasoning)</option>
                  </select>
                </div>

                {/* Voice Feedback Speaker Toggle */}
                <button
                  onClick={() => setIsVoiceResponseActive(!isVoiceResponseActive)}
                  className={`p-1 px-2 rounded border transition flex items-center gap-1 ${isVoiceResponseActive ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                  title="Озвучувати відповіді ШІ"
                >
                  {isVoiceResponseActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isVoiceResponseActive ? "Голос" : "Викл"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Grounding tools */}
                <div className="flex items-center gap-2 flex-grow">
                  <button
                    onClick={() => {
                      setUseSearch(!useSearch);
                      setUseMaps(false);
                    }}
                    className={`flex-1 py-1 rounded border transition flex items-center justify-center gap-1 ${useSearch ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                    title="Заземлення через Google Пошук"
                  >
                    <Search className="w-3 h-3" />
                    <span>Google Пошук</span>
                  </button>
                  <button
                    onClick={() => {
                      setUseMaps(!useMaps);
                      setUseSearch(false);
                    }}
                    className={`flex-1 py-1 rounded border transition flex items-center justify-center gap-1 ${useMaps ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                    title="Заземлення через Карти Google"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Карти Google</span>
                  </button>
                </div>

                {/* Reasoning level toggle (only for pro model) */}
                {simModel === 'gemini-3.1-pro-preview' && (
                  <button
                    onClick={() => setHighThinking(!highThinking)}
                    className={`px-2 py-1 rounded border transition font-bold flex items-center gap-1 ${highThinking ? 'bg-amber-600/20 border-amber-500 text-amber-300 animate-pulse' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                    title="Увімкнути глибинне мислення"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>High Thinking</span>
                  </button>
                )}
              </div>
            </div>

            <div ref={simChatRef} className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {simMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-none' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'
                  }`}>
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isSimulating && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl rounded-tl-none text-xs text-zinc-500 italic flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Gemini is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* STARTERS IN CHAT */}
            {starters.length > 0 && simMessages.length === 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {starters.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSimInput(s);
                      runSimulation(s);
                    }}
                    className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-white px-3 py-1.5 rounded-full transition-all flex items-center gap-2 group"
                  >
                    <Smile className="w-3 h-3 text-violet-500 group-hover:scale-110 transition-transform" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-zinc-800 bg-zinc-900 shrink-0 pb-6 md:pb-3 space-y-1.5">
              <div className="relative">
                <input 
                  type="text" 
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 pl-9 pr-10 text-[11px] text-white focus:border-violet-500 outline-none transition-all" 
                  placeholder={isTranscribing ? "Розшифровуємо голос..." : "Напишіть або продиктуйте запит..."}
                  disabled={isTranscribing}
                />
                
                {/* Voice Dictation (Gemini Transcription) */}
                <button 
                  onClick={isRecordingAudio ? stopRecordingAudio : startRecordingAudio}
                  disabled={isTranscribing}
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${isRecordingAudio ? 'text-red-500 animate-pulse hover:text-red-400' : 'text-zinc-500 hover:text-violet-400'}`}
                  title={isRecordingAudio ? "Зупинити та надіслати" : "Продиктувати голосом"}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>

                <button 
                  onClick={() => runSimulation()}
                  disabled={isSimulating || !simInput.trim() || isTranscribing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around z-50 px-2">
        <button 
          onClick={() => setMobileTab('core')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'core' ? 'text-violet-500' : 'text-zinc-500'}`}
        >
          <Fingerprint className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Сутність</span>
        </button>
        <button 
          onClick={() => setMobileTab('builder')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'builder' ? 'text-violet-500' : 'text-zinc-500'}`}
        >
          <Network className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Логіка</span>
        </button>
        <button 
          onClick={() => setMobileTab('chat')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'chat' ? 'text-violet-500' : 'text-zinc-500'}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Чат</span>
        </button>
      </div>

      {/* BRIDGE MODAL */}
      <AnimatePresence>
        {isBridgeModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-emerald-900/20 to-transparent">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                  <Rocket className="w-4 h-4 text-emerald-400" /> BRIDGE TO GEMS
                </h2>
                <button onClick={() => setIsBridgeModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                <BridgeStep 
                  number={1} 
                  title="Назва Gems" 
                  value={role} 
                  onCopy={() => copyToClipboard(role)} 
                />
                <BridgeStep 
                  number={2} 
                  title="Системні Інструкції" 
                  value="Комплексний промпт" 
                  onCopy={() => copyToClipboard(finalPrompt)} 
                  color="emerald"
                />
                <div className="flex items-center gap-4 group p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-orange-900/50 border border-orange-500 flex items-center justify-center font-bold text-orange-300">3</div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Starters ({starters.length})</p>
                    <p className="text-[10px] text-zinc-400">Питання для швидкого старту</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(starters.join('\n'))}
                    className="px-3 py-1 bg-zinc-800 hover:bg-orange-600 text-zinc-300 hover:text-white rounded text-[10px] font-bold transition border border-zinc-700"
                  >
                    COPY ALL
                  </button>
                </div>
                <div className="flex items-center gap-4 group p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-violet-900/50 border border-violet-500 flex items-center justify-center font-bold text-violet-300">4</div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Standard Tool</p>
                    <p className="text-[10px] text-zinc-400">{standardTool}</p>
                  </div>
                  <div className="text-[10px] text-violet-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Налаштуйте в Gemini
                  </div>
                </div>
                <div className="flex items-center gap-4 group p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500 flex items-center justify-center font-bold text-blue-300">5</div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Knowledge (Wissen)</p>
                    <p className="text-[10px] text-zinc-400">{knowledgePlan ? "Planned" : "Empty"}</p>
                  </div>
                  <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Завантажте файли
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                  <a 
                    href="https://gemini.google.com/gems/create" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition transform hover:scale-105"
                  >
                    Відкрити Gemini Gems <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLOUD GEMS EXPLORER MODAL */}
      <AnimatePresence>
        {isCloudGemsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-violet-900/20 to-transparent">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                  <Cloud className="w-4 h-4 text-violet-400 animate-pulse" /> Хмарна Бібліотека Gems
                </h2>
                <button onClick={() => setIsCloudGemsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {isCloudLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    <span className="text-xs">Завантаження вашої бібліотеки з Firestore...</span>
                  </div>
                ) : savedGems.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 space-y-2">
                    <CloudLightning className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-bold">У вашій хмарі немає збережених Gems</p>
                    <p className="text-[10px]">Змоделюйте Gem у конструкторі та натисніть &quot;Зберегти&quot; у верхньому меню.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedGems.map((gem) => (
                      <div 
                        key={gem.id}
                        onClick={() => handleLoadGemFromCloud(gem)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${selectedGemId === gem.id ? 'bg-violet-600/10 border-violet-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase group-hover:text-violet-400 transition-colors">{gem.role || "Універсальний Gem"}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono">Оновлено: {new Date(gem.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedGemId === gem.id && (
                            <span className="text-[8px] uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded font-bold">Активний</span>
                          )}
                          <button
                            onClick={(e) => handleDeleteGemFromCloud(gem.id, e)}
                            className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition"
                            title="Видалити"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TreeNodeUI({ node, level, onUpdate, onAddChild, onDelete, onMove }: { 
  node: TreeNode, 
  level: number, 
  onUpdate: (id: string, text: string) => void,
  onAddChild: (id: string) => void,
  onDelete: (id: string) => void,
  onMove: (id: string, direction: 'up' | 'down') => void
}) {
  return (
    <div className={`relative ${level > 0 ? 'ml-4' : 'mb-3 bg-zinc-900/50 rounded-xl border border-zinc-800 p-3'}`}>
      {level > 0 && (
        <>
          <div className="absolute left-[-10px] top-[14px] w-[10px] h-px bg-zinc-700" />
          <div className="absolute left-[-10px] top-0 bottom-0 w-px bg-zinc-700" />
        </>
      )}
      <div className="flex items-center gap-2 group">
        {level === 0 && (
          <span className="text-[8px] font-bold text-violet-500 bg-violet-900/20 px-1.5 py-0.5 rounded uppercase tracking-widest">ЕТАП</span>
        )}
        <div className={`w-2 h-2 rounded-full shrink-0 ${level === 0 ? 'bg-violet-500' : 'bg-zinc-700 group-hover:bg-violet-500 transition-colors'}`} />
        <input 
          type="text" 
          value={node.text}
          onChange={(e) => onUpdate(node.id, e.target.value)}
          className={`bg-transparent border-none text-xs w-full focus:outline-none transition-all py-1 ${level === 0 ? 'font-bold text-white' : 'text-zinc-400 focus:text-white font-mono'}`}
          placeholder="Опишіть дію..."
        />
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
          <button onClick={() => onMove(node.id, 'up')} className="p-1 text-zinc-500 hover:text-violet-400 transition-colors">
            <ArrowUp className="w-3 h-3" />
          </button>
          <button onClick={() => onMove(node.id, 'down')} className="p-1 text-zinc-500 hover:text-violet-400 transition-colors">
            <ArrowDown className="w-3 h-3" />
          </button>
          <button onClick={() => onAddChild(node.id)} className="p-1 text-zinc-500 hover:text-emerald-400 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(node.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="mt-1">
          {node.children.map(child => (
            <TreeNodeUI 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onUpdate={onUpdate} 
              onAddChild={onAddChild} 
              onDelete={onDelete} 
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BridgeStep({ number, title, value, onCopy, color = "violet" }: { 
  number: number, 
  title: string, 
  value: string, 
  onCopy: () => void,
  color?: "violet" | "emerald"
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorClasses = color === "violet" 
    ? "group-hover:border-violet-500 group-hover:text-violet-500" 
    : "group-hover:border-emerald-500 group-hover:text-emerald-500";

  const btnClasses = color === "violet"
    ? "hover:bg-violet-600"
    : "hover:bg-emerald-600";

  return (
    <div className="flex items-center gap-4 group p-3 hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-700">
      <div className={`w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-500 transition-all ${colorClasses}`}>
        {number}
      </div>
      <div className="flex-grow">
        <p className="text-xs font-bold text-white uppercase tracking-wider">{title}</p>
        <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{value}</p>
      </div>
      <button 
        onClick={handleCopy}
        className={`px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-zinc-700 ${btnClasses}`}
      >
        {copied ? "COPIED!" : "COPY"}
      </button>
    </div>
  );
}
