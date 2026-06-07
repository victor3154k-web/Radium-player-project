import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Upload,
  Maximize,
  Maximize2,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Type,
  Lock,
  Unlock,
  Settings,
  X,
  RotateCcw,
  Search,
  Check,
  ChevronDown,
  ThumbsUp,
  Share2,
  Download,
  MoreVertical,
  Folder,
  Film,
  LayoutGrid,
  Sparkles,
  Sliders,
  ChevronUp,
  ArrowLeft,
  Tv,
  Eye,
  Settings2,
  Laptop,
  PictureInPicture,
  Trash2,
  Plus,
  Battery,
  BatteryCharging,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseSubtitles, SAMPLE_SUBTITLES_PT } from './utils/subtitleParser';
import {
  PerformanceProfile,
  DecoderMode,
  AspectRatio,
  SubtitleStyle,
  SubtitleItem,
  PlaybackFile
} from './types';

export default function App() {
  // --- Playlist Estilo Gerenciador de Arquivos do Usuário ---
  const [files, setFiles] = useState<PlaybackFile[]>([]);

  // --- Core States ---
  const [currentFile, setCurrentFile] = useState<PlaybackFile | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'folders' | 'settings'>('videos');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // From grid icon index

  // --- Playback States ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(17);
  const [volume, setVolume] = useState<number>(0.8);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [decoderMode, setDecoderMode] = useState<'HW' | 'HW+' | 'SW'>('HW');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('fit');
  const [zoom, setZoom] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // --- Subtitles States ---
  const [rawSubtitleText, setRawSubtitleText] = useState<string>(SAMPLE_SUBTITLES_PT);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(parseSubtitles(SAMPLE_SUBTITLES_PT));
  const [subtitleDelay, setSubtitleDelay] = useState<number>(0);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontFamily: 'Inter',
    fontSize: 16,
    textColor: '#ffffff',
    shadowColor: '#000000',
    backgroundColor: 'rgba(5, 8, 20, 0.85)', // Thunder blue black
    backgroundOpacity: 0.85,
    verticalOffset: 12,
    isBold: true,
    shadowBlur: 4
  });

  // --- Aesthetic Social Interaction states ---
  const [likesCount, setLikesCount] = useState<number>(2048);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);

  // --- Gesture Popup Notification ---
  const [gestureType, setGestureType] = useState<'volume' | 'brightness' | 'seek' | 'zoom' | null>(null);
  const [gestureValue, setGestureValue] = useState<string>('');
  const [showGestureModal, setShowGestureModal] = useState<boolean>(false);

  // --- Drag and Drop overlay ---
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFloatingPip, setIsFloatingPip] = useState<boolean>(false);

  // --- Custom Extension & Splash States ---
  const [isSplashLoading, setIsSplashLoading] = useState<boolean>(true);
  const [showExtensionModal, setShowExtensionModal] = useState<boolean>(false);
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>(['.mp4', '.mkv', '.webm', '.mkk', '.avi', '.mov']);
  const [newExtensionInput, setNewExtensionInput] = useState<string>('');
  const [performanceProfile, setPerformanceProfile] = useState<PerformanceProfile>('balanced');

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 2200);
    return () => clearTimeout(splashTimer);
  }, []);

  const handleAddExtension = (e: React.FormEvent) => {
    e.preventDefault();
    let ext = newExtensionInput.trim().toLowerCase();
    if (!ext) return;
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    if (allowedExtensions.includes(ext)) {
      triggerGestureFeedback('zoom', 'Extensão já existe!');
      return;
    }
    setAllowedExtensions(prev => [...prev, ext]);
    setNewExtensionInput('');
    triggerGestureFeedback('zoom', `Extensão ${ext} Adicionada!`);
  };

  const handleRemoveExtension = (ext: string) => {
    if (['.mp4', '.mkv', '.webm'].includes(ext)) {
      triggerGestureFeedback('zoom', 'Formato base protegido');
      return;
    }
    setAllowedExtensions(prev => prev.filter(e => e !== ext));
    triggerGestureFeedback('zoom', `Removido: ${ext}`);
  };

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const floatingVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const srtInputRef = useRef<HTMLInputElement | null>(null);

  // --- Double click / touch tracker for gesture seek delay ---
  const gestureTimeoutRef = useRef<number | null>(null);

  // Sync state between standard and floating video players during PIP transitions
  useEffect(() => {
    if (!currentFile) return;
    if (isFloatingPip) {
      setTimeout(() => {
        if (floatingVideoRef.current) {
          floatingVideoRef.current.src = currentFile.url;
          floatingVideoRef.current.load();
          floatingVideoRef.current.currentTime = currentTime;
          floatingVideoRef.current.playbackRate = playbackSpeed;
          floatingVideoRef.current.muted = isMuted;
          floatingVideoRef.current.volume = volume;
          if (isPlaying) {
            floatingVideoRef.current.play().catch(() => {});
          }
        }
      }, 50);
    } else {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = currentFile.url;
          videoRef.current.load();
          videoRef.current.currentTime = currentTime;
          videoRef.current.playbackRate = playbackSpeed;
          videoRef.current.muted = isMuted;
          videoRef.current.volume = volume;
          if (isPlaying) {
            videoRef.current.play().catch(() => {});
          }
        }
      }, 50);
    }
  }, [isFloatingPip, currentFile]);

  // Synchronize playing state across active reference
  useEffect(() => {
    const activeVideo = isFloatingPip ? floatingVideoRef.current : videoRef.current;
    if (activeVideo) {
      if (isPlaying) {
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.pause();
      }
    }
  }, [isPlaying]);

  // --- Sync subtitles when text changes ---
  useEffect(() => {
    setSubtitles(parseSubtitles(rawSubtitleText));
  }, [rawSubtitleText]);

  // --- Retrieve Active Subtitle Line ---
  const getActiveSubtitle = (): string => {
    const adjusted = currentTime - subtitleDelay;
    const match = subtitles.find(s => adjusted >= s.startTime && adjusted <= s.endTime);
    return match ? match.text : '';
  };

  // --- Handle Media Selection ---
  const selectFileToPlay = (file: PlaybackFile) => {
    setCurrentFile(file);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(file.duration || 120);

    const activeVideo = isFloatingPip ? floatingVideoRef.current : videoRef.current;
    if (activeVideo) {
      activeVideo.src = file.url;
      activeVideo.load();
    }
    
    // Smooth scroll key elements of active player into viewport view for users 
    const playerWrapper = document.getElementById('player-stage-scroll-point');
    if (playerWrapper) {
      playerWrapper.scrollIntoView({ behavior: 'smooth' });
    }

    triggerGestureFeedback('seek', `Abrindo: ${file.name.substring(0, 20)}...`);
  };

  // --- Import File Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same file can be successfully imported again if deleted
    e.target.value = '';

    const splitName = file.name.split('.');
    const ext = '.' + splitName.pop()?.toLowerCase();

    // Re-create Blob with video/mp4 standard media type if renamed to .mkk to allow correct browser decoder playback
    let processedFile: File | Blob = file;
    if (ext === '.mkk') {
      processedFile = new Blob([file], { type: 'video/mp4' });
    }

    const fileUrl = URL.createObjectURL(processedFile);

    // Randomize length and scale size for UI consistency
    const sizeKBOrMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

    const playObject: PlaybackFile = {
      name: file.name,
      url: fileUrl,
      extension: ext,
      isExample: false,
      duration: 120, // default 2 minutes
      sizeMB: sizeKBOrMB,
      folder: 'Dispositivo'
    };

    // Fast-loading temporary video element to capture actual duration quickly
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = fileUrl;
    tempVideo.onloadedmetadata = () => {
      const realDur = Math.round(tempVideo.duration) || 120;
      playObject.duration = realDur;
      setDuration(realDur);
      setFiles(prev => prev.map(f => f.name === playObject.name ? { ...f, duration: realDur } : f));
    };

    setFiles(prev => [playObject, ...prev]);
    setSelectedFolder(null);
    setActiveTab('videos');
    
    // Select the newly imported file to play and initialize internal video references
    setTimeout(() => {
      selectFileToPlay(playObject);
    }, 100);

    triggerGestureFeedback('brightness', `Vídeo Importado com Sucesso!`);
  };

  // --- Import Subtitle File Handler ---
  const handleSrtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so the same subtitle can be successfully imported again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawSubtitleText(text);
        triggerGestureFeedback('seek', 'Legenda Sincronizada');
        setActiveTab('settings'); // focus on settings/subtitles panel
      }
    };
    reader.readAsText(file);
  };

  // --- Wheel Action trackpad Zoom ---
  const handleWheelAction = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const factor = e.deltaY < 0 ? 8 : -8;
    const nextZoom = Math.min(300, Math.max(100, zoom + factor));
    setZoom(nextZoom);
    triggerGestureFeedback('zoom', `Zoom: ${nextZoom}%`);
  };

  // --- Dynamic feedback popup trigger ---
  const triggerGestureFeedback = (type: 'volume' | 'brightness' | 'seek' | 'zoom', metric: string) => {
    setGestureType(type);
    setGestureValue(metric);
    setShowGestureModal(true);

    if (gestureTimeoutRef.current) {
      window.clearTimeout(gestureTimeoutRef.current);
    }
    gestureTimeoutRef.current = window.setTimeout(() => {
      setShowGestureModal(false);
    }, 1200);
  };

  // Native browser Picture-in-Picture mode handler
  const handleNativePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        triggerGestureFeedback('zoom', 'PIP Nativo Desativado');
      } else {
        await videoRef.current.requestPictureInPicture();
        triggerGestureFeedback('zoom', 'PIP Nativo Ativado');
      }
    } catch (err) {
      console.error("Erro Picture-in-Picture nativo:", err);
      triggerGestureFeedback('zoom', 'Não suportado no navegador');
    }
  };

  // Delete media item handler
  const handleDeleteFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    const remainingFiles = files.filter(f => f.name !== fileName);
    setFiles(remainingFiles);

    // If deleting the current file, play the next available
    if (currentFile && currentFile.name === fileName) {
      if (remainingFiles.length > 0) {
        selectFileToPlay(remainingFiles[0]);
      } else {
        setCurrentFile(undefined);
      }
    }
  };

  // --- Handlers for playback control triggers ---
  const handlePlayPause = () => {
    if (isLocked) {
      triggerGestureFeedback('zoom', 'Tela Bloqueada');
      return;
    }
    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);

    const activeVideo = isFloatingPip ? floatingVideoRef.current : videoRef.current;
    if (activeVideo) {
      if (nextPlayState) {
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.pause();
      }
    }
  };

  const handleSeekProgress = (secs: number) => {
    if (isLocked) return;
    setCurrentTime(secs);
    const activeVideo = isFloatingPip ? floatingVideoRef.current : videoRef.current;
    if (activeVideo) {
      activeVideo.currentTime = secs;
    }
  };

  const handleSpeedChange = (mult: number) => {
    if (isLocked) return;
    setPlaybackSpeed(mult);
    if (videoRef.current) {
      videoRef.current.playbackRate = mult;
    }
    if (floatingVideoRef.current) {
      floatingVideoRef.current.playbackRate = mult;
    }
  };

  const toggleFullScreen = () => {
    const elem = document.getElementById('video-player-root-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        console.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
      triggerGestureFeedback('zoom', 'Tela Cheia');
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // --- Swipe Gesture Logic ---
  const swipeStartY = useRef<number>(0);
  const swipeStartX = useRef<number>(0);
  const isSwipingActive = useRef<boolean>(false);
  const swipeDirection = useRef<'v-l' | 'v-r' | 'h' | null>(null);

  const handleSwipeStart = (clientX: number, clientY: number) => {
    if (isLocked) return;
    swipeStartY.current = clientY;
    swipeStartX.current = clientX;
    isSwipingActive.current = true;
    swipeDirection.current = null;
  };

  const handleSwipeMove = (clientX: number, clientY: number, containerRect: DOMRect) => {
    if (!isSwipingActive.current || isLocked) return;
    const dx = clientX - swipeStartX.current;
    const dy = clientY - swipeStartY.current;

    const midX = containerRect.left + containerRect.width / 2;
    const isLeftHalf = swipeStartX.current < midX;

    if (!swipeDirection.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        swipeDirection.current = isLeftHalf ? 'v-l' : 'v-r';
      } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
        swipeDirection.current = 'h';
      }
    }

    if (swipeDirection.current === 'v-l') {
      const step = -dy / 220;
      const nextBright = Math.min(1.0, Math.max(0.1, brightness + step));
      setBrightness(nextBright);
      triggerGestureFeedback('brightness', `Brilho: ${Math.round(nextBright * 100)}%`);
      swipeStartY.current = clientY;
    } else if (swipeDirection.current === 'v-r') {
      const step = -dy / 220;
      const nextVol = Math.min(1.0, Math.max(0.0, volume + step));
      setVolume(nextVol);
      if (videoRef.current) {
        videoRef.current.volume = nextVol;
        videoRef.current.muted = nextVol === 0;
      }
      setIsMuted(nextVol === 0);
      triggerGestureFeedback('volume', `Volume: ${Math.round(nextVol * 100)}%`);
      swipeStartY.current = clientY;
    } else if (swipeDirection.current === 'h') {
      const step = dx * 0.35;
      const nextTime = Math.min(duration, Math.max(0, currentTime + step));
      setCurrentTime(nextTime);
      triggerGestureFeedback('seek', `${step >= 0 ? '+' : ''}${Math.round(step)}s (${formatTime(nextTime)})`);
      swipeStartX.current = clientX;
    }
  };

  const handleSwipeEnd = () => {
    if (swipeDirection.current === 'h') {
      handleSeekProgress(currentTime);
    }
    isSwipingActive.current = false;
    swipeDirection.current = null;
  };

  const handleDoubleTapAction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < rect.width * 0.3) {
      const target = Math.max(0, currentTime - 10);
      handleSeekProgress(target);
      triggerGestureFeedback('seek', `Recuar 10s`);
    } else if (x > rect.width * 0.7) {
      const target = Math.min(duration, currentTime + 10);
      handleSeekProgress(target);
      triggerGestureFeedback('seek', `Avançar 10s`);
    } else {
      handlePlayPause();
    }
  };

  // --- Drag & Drop file loaders ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const splitName = file.name.split('.');
    const ext = '.' + splitName.pop()?.toLowerCase();
    const sizeKBOrMB = parseFloat((file.size / (1024 * 1024)).toFixed(2));

    if (ext === '.srt' || ext === '.vtt' || ext === '.txt') {
      // Subtitle dropped
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawSubtitleText(text);
          triggerGestureFeedback('seek', 'Legenda Importada');
          setActiveTab('settings');
        }
      };
      reader.readAsText(file);
    } else {
      // Re-create Blob with video/mp4 standard media type if renamed to .mkk to allow correct browser decoder playback
      let processedFile: File | Blob = file;
      if (ext === '.mkk') {
        processedFile = new Blob([file], { type: 'video/mp4' });
      }

      const fileUrl = URL.createObjectURL(processedFile);

      // Physical media file dropped
      const playObject: PlaybackFile = {
        name: file.name,
        url: fileUrl,
        extension: ext,
        isExample: false,
        duration: 120,
        sizeMB: sizeKBOrMB,
        folder: 'Dispositivo Drop'
      };

      // Fast-loading temporary video element to capture actual duration quickly
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = fileUrl;
      tempVideo.onloadedmetadata = () => {
        const realDur = Math.round(tempVideo.duration) || 120;
        playObject.duration = realDur;
        setDuration(realDur);
        setFiles(prev => prev.map(f => f.name === playObject.name ? { ...f, duration: realDur } : f));
      };

      setFiles(prev => [playObject, ...prev]);
      setSelectedFolder(null);
      setActiveTab('videos');
      
      // Select the newly dropped file to play and initialize internal video references
      setTimeout(() => {
        selectFileToPlay(playObject);
      }, 100);

      triggerGestureFeedback('brightness', `Vídeo Importado via Drop!`);
    }
  };

  // --- Format Seconds into Standard readable timestamp (0:00 / 0:00) ---
  const formatTime = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const zeroPrefix = (num: number) => (num < 10 ? `0${num}` : `${num}`);
    if (h > 0) return `${h}:${zeroPrefix(m)}:${zeroPrefix(s)}`;
    return `${m}:${zeroPrefix(s)}`;
  };

  // --- Generate Distinct Background Gradients for Mock Video Thumbnails ---
  const getThumbnailGradient = (index: number) => {
    const gradients = [
      'from-zinc-900 to-black',
      'from-neutral-900 to-zinc-950',
      'from-stone-900 to-neutral-900',
      'from-zinc-800 to-neutral-950',
      'from-neutral-800 to-black',
      'from-stone-950 to-zinc-900',
      'from-neutral-950 to-neutral-900',
      'from-zinc-950 to-zinc-800',
      'from-stone-800 to-black'
    ];
    return gradients[index % gradients.length];
  };

  // --- Dynamic Search Filter ---
  const searchFilteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder ? f.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  // --- Pastas (Folders) grouping aggregator ---
  const getFolderGroups = () => {
    const groups: { [key: string]: { files: PlaybackFile[]; totalSize: number } } = {};
    files.forEach(f => {
      const folderName = f.folder || 'Outros';
      if (!groups[folderName]) {
        groups[folderName] = { files: [], totalSize: 0 };
      }
      groups[folderName].files.push(f);
      groups[folderName].totalSize += f.sizeMB || 0;
    });
    return Object.entries(groups).map(([name, data]) => ({
      name,
      count: data.files.length,
      totalSize: parseFloat(data.totalSize.toFixed(2)),
      thumbnailGrad: getThumbnailGradient(name.charCodeAt(0))
    }));
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#000000] text-[#f1f5f9] font-sans selection:bg-zinc-800 selection:text-white transition-all duration-300 relative"
    >
      {/* Dynamic Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#000000]/95 z-[100] backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-zinc-700 p-6 text-center">
          <Upload className="w-16 h-16 text-white animate-bounce mb-4" />
          <p className="text-xl font-bold font-display text-white">Solte seu vídeo ou legenda SRT aqui</p>
          <p className="text-xs text-zinc-400 mt-2">O player sincronizará os arquivos imediatamente</p>
        </div>
      )}

      {/* STYLISH GLOBAL MAIN GRID LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24">
        
        {/* BRAND HEADER BAR */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-6 border-b border-[#111827]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg shadow-white/5">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white font-display uppercase">
                Radium <span className="text-zinc-400">Player</span>
              </h1>
              <p className="text-xs text-zinc-500 font-mono">Alta Performance e Organização de Vídeos Offline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Upload action buttons */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all rounded-full flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" /> Abrir Vídeo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={`video/*,.mkk,${allowedExtensions.join(',')}`}
              className="hidden"
            />

            <button
              onClick={() => srtInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all rounded-full flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Type className="w-3.5 h-3.5 text-zinc-400" /> Carregar SRT
            </button>
            <input
              type="file"
              ref={srtInputRef}
              onChange={handleSrtFileChange}
              accept=".srt,.vtt,.txt"
              className="hidden"
            />
          </div>
        </header>

        {/* REVOLUTIONARY DUAL PANE ENVIRONMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* THEATER PLAYBACK CENTER STAGE (Span 7) */}
          {currentFile && (
            <div id="player-stage-scroll-point" className="lg:col-span-7 flex flex-col gap-4">
            
            {/* STAGE WRAPPER OVERLAY */}
            <div
              id="video-player-root-container"
              onWheel={handleWheelAction}
              onTouchStart={e => handleSwipeStart(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleSwipeMove(e.touches[0].clientX, e.touches[0].clientY, rect);
              }}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={e => handleSwipeStart(e.clientX, e.clientY)}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleSwipeMove(e.clientX, e.clientY, rect);
              }}
              onMouseLeave={handleSwipeEnd}
              onMouseUp={handleSwipeEnd}
              onDoubleClick={handleDoubleTapAction}
              className="relative w-full aspect-video rounded-3xl overflow-hidden bg-[#020205] border border-zinc-800 touch-none block shadow-xl"
            >
              {/* Dynamic screen contrast filter adjustment */}
              <div
                className="absolute inset-0 pointer-events-none z-[8] transition-opacity"
                style={{
                  backgroundColor: `rgba(0, 0, 0, ${1.0 - brightness})`
                }}
              />

              {/* Dynamic Gesture Feedback HUD Overlay */}
              <AnimatePresence>
                {showGestureModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center z-[25] pointer-events-none"
                  >
                    <div className="px-5 py-3.5 bg-[#020205]/90 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-3 select-none">
                      {gestureType === 'volume' && <Volume2 className="w-5 h-5 text-blue-400" />}
                      {gestureType === 'brightness' && <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />}
                      {gestureType === 'seek' && <RotateCcw className="w-5 h-5 text-emerald-400" />}
                      {gestureType === 'zoom' && <Maximize className="w-5 h-5 text-indigo-400" />}
                      <span className="text-white text-xs uppercase font-bold tracking-widest font-mono">
                        {gestureValue}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ACTIVE PHYSICAL STREAM RENDER VIEWPORT */}
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  transform: `scale(${zoom / 100}) translate(${panX}px, ${panY}px)`
                }}
              >
                {!currentFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-[#020205] flex flex-col items-center justify-center gap-4 text-center p-6 z-[9] pointer-events-auto cursor-pointer border border-dashed border-zinc-800 rounded-3xl hover:border-zinc-500 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all">
                      <Film className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1 max-w-sm">
                      <span className="text-sm font-semibold text-slate-100 font-sans">Nenhum vídeo carregado no reprodutor</span>
                      <span className="text-[12px] text-zinc-500 font-sans leading-relaxed">Arraste um vídeo local para qualquer área da aplicação ou clique aqui para selecionar e iniciar a reprodução.</span>
                    </div>
                  </div>
                ) : isFloatingPip ? (
                  <div className="absolute inset-0 bg-[#020205] flex flex-col items-center justify-center gap-4 text-center p-6 z-[9] pointer-events-auto">
                    <Laptop className="w-12 h-12 text-white animate-pulse" />
                    <span className="text-sm font-semibold text-slate-100 font-sans">Vídeo Rodando em Pop-up Flutuante</span>
                    <button
                      onClick={() => setIsFloatingPip(false)}
                      className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-white/5 active:scale-95 cursor-pointer font-sans"
                    >
                      <Maximize className="w-3.5 h-3.5" /> Restaurar Player
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={currentFile?.url}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => {
                      setDuration(videoRef.current?.duration || 120);
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                    onPlay={() => {
                      setIsPlaying(true);
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                    onPause={() => setIsPlaying(false)}
                    loop={isLooping}
                    playsInline
                    className={`w-full h-full pointer-events-auto ${
                      aspectRatio === 'stretch' ? 'object-fill' :
                      aspectRatio === 'zoom' ? 'object-cover' :
                      'object-contain'
                    }`}
                  />
                )}
              </div>

              {/* SUBTITLE TRACK DISPLAY BAR */}
              {getActiveSubtitle() && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 z-[10] text-center max-w-[85%] select-none transition-all pointer-events-none px-4"
                  style={{
                    bottom: `${subtitleStyle.verticalOffset}%`
                  }}
                >
                  <span
                    style={{
                      fontFamily: subtitleStyle.fontFamily,
                      fontSize: `${subtitleStyle.fontSize}px`,
                      color: subtitleStyle.textColor,
                      fontWeight: subtitleStyle.isBold ? '700' : '400',
                      backgroundColor: subtitleStyle.backgroundColor,
                      textShadow: `1px 1px ${subtitleStyle.shadowBlur}px ${subtitleStyle.shadowColor}`
                    }}
                    className="px-4 py-2 rounded-2xl transition-all inline-block backdrop-blur-md border border-white/5"
                  >
                    {getActiveSubtitle()}
                  </span>
                </div>
              )}

              {/* FLOATING ACTION SPEED MULTIPLIER AND LOCK/UNLOCK BUTTONS */}
              <div className="absolute top-4 right-4 z-[21] flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFloatingPip(!isFloatingPip);
                  }}
                  disabled={isLocked}
                  className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 bg-black/80 transition-all cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
                  title="Reprodução Pop-up (In-App)"
                >
                  <PictureInPicture className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNativePip();
                  }}
                  disabled={isLocked}
                  className="p-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 bg-black/80 transition-all cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
                  title="Picture-in-Picture Nativo"
                >
                  <Tv className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLocked(!isLocked);
                    triggerGestureFeedback('zoom', isLocked ? 'Ajustes Habilitados' : 'Dispositivo Bloqueado');
                  }}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                    isLocked
                      ? 'bg-white border-white text-black shadow-lg'
                      : 'bg-black/80 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={isLocked ? 'Desbloquear Controles' : 'Bloquear Controles'}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>




            </div>

            {/* SECTOR PROGRESS TIMELINE ACCENTED SEEKBAR */}
            <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400">{formatTime(currentTime)}</span>
                <div className="flex-1 relative py-1 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || 120}
                    step="0.05"
                    value={currentTime}
                    disabled={isLocked}
                    onChange={(e) => handleSeekProgress(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-900 accent-white rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all disabled:opacity-50"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / (duration || 120)) * 100}%, #111827 ${(currentTime / (duration || 120)) * 100}%, #111827 100%)`
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-500">{formatTime(duration)}</span>
              </div>

              {/* PRIMARY MEDIA ACTIONS ROWS */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer shadow-md shadow-white/5"
                    title={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked) return;
                      const nextMute = !isMuted;
                      setIsMuted(nextMute);
                      if (videoRef.current) videoRef.current.muted = nextMute;
                      triggerGestureFeedback('volume', nextMute ? 'Muted' : `Volume: ${Math.round(volume * 100)}%`);
                    }}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded-full hover:text-white transition-all cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-350" />}
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked) return;
                      setIsFloatingPip(!isFloatingPip);
                    }}
                    disabled={isLocked}
                    className={`p-2.5 border transition-all rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold ${
                      isFloatingPip 
                        ? 'bg-white text-black border-white font-bold shadow-lg shadow-white/5'
                        : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-medium hover:scale-105 active:scale-95'
                    }`}
                    title="Reproduzir em Pop-up Flutuante"
                  >
                    <PictureInPicture className="w-4 h-4" />
                    <span className="hidden sm:inline">Pop-up</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked) return;
                      toggleFullScreen();
                    }}
                    disabled={isLocked}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium hover:scale-105 active:scale-95 disabled:opacity-50"
                    title="Alternar Tela Cheia"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Tela Cheia</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked) return;
                      setIsLooping(!isLooping);
                    }}
                    disabled={isLocked}
                    className={`p-2.5 border transition-all rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold ${
                      isLooping 
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-zinc-400 hover:text-white font-medium hover:scale-105 active:scale-95'
                    }`}
                    title={isLooping ? 'Desativar repetição loop' : 'Ativar repetição loop'}
                  >
                    <RotateCcw className={`w-4 h-4 ${isLooping ? 'animate-spin-slow' : ''}`} />
                    <span className="hidden sm:inline">Loop</span>
                  </button>
                </div>

                {/* Aspect ratios switches */}
                <div className="flex items-center bg-zinc-950 p-1 rounded-full border border-zinc-800">
                  {(['fit', 'stretch', 'zoom'] as AspectRatio[]).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => {
                        if (isLocked) return;
                        setAspectRatio(aspect);
                        triggerGestureFeedback('zoom', `Visual: ${aspect.toUpperCase()}`);
                      }}
                      disabled={isLocked}
                      className={`px-3 py-1 text-[10px] font-mono rounded-full uppercase transition-all whitespace-nowrap cursor-pointer ${
                        aspectRatio === aspect
                          ? 'bg-white text-black font-bold'
                          : 'text-zinc-550 hover:text-white'
                      }`}
                    >
                      {aspect}
                    </button>
                  ))}
                  {zoom > 100 && (
                    <button
                      onClick={() => {
                        setZoom(100);
                        triggerGestureFeedback('zoom', 'Zoom restaurado');
                      }}
                      className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white font-mono font-bold underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Decoder options HW, HW+, SW */}
                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-full border border-zinc-800">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase px-2 select-none">Decoder</span>
                  {(['HW', 'HW+', 'SW'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (isLocked) return;
                        setDecoderMode(mode);
                      }}
                      disabled={isLocked}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-full font-bold uppercase transition-all cursor-pointer ${
                        decoderMode === mode
                          ? 'bg-white text-black'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPANDED SYSTEM VIDEO AND MEDIA CHANNEL DETAILS CARD */}
            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-800">
              <h2 className="text-lg font-bold tracking-tight text-white font-display select-text">
                {currentFile ? currentFile.name : 'Nenhum vídeo selecionado'}
              </h2>
            </div>

          </div>
          )}

          {/* DYNAMIC ORG PANEL FILES LIBRARY (Span 5 - EXACT SCREENSHOT STYLE COPIED) */}
          <div className={`${currentFile ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-5`}>
            
            {/* SEARCH SLIDEDOWN INPUT FIELD */}
            {showSearch && (
              <div className="bg-[#0a0a0a] border border-zinc-800 p-3 rounded-2xl animate-fade-in">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filtrar vídeos locais por nome..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#000000] text-sm text-slate-200 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-250 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB-DEPENDENT CONTENT RENDER PANEL */}
            <AnimatePresence mode="wait">
              {/* VIDEOS EXPLORER VIEW */}
              {activeTab === 'videos' && (
                <motion.div
                  key="videos"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[#000000] border border-neutral-900 rounded-3xl p-5 flex flex-col gap-4"
                >
                
                {/* EXPLORER TITLES ACCORDING TO SCREENSHOT */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-normal tracking-tight text-white select-none">
                      Vídeos
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-1 uppercase tracking-widest font-mono">
                      {selectedFolder ? `${selectedFolder} • ` : ''}{searchFilteredFiles.length} vídeos
                    </p>
                  </div>

                  {/* Header action widgets */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                      onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                      className={`p-2.5 rounded-full hover:bg-neutral-900 hover:text-white transition-all cursor-pointer ${viewMode === 'grid' ? 'text-white bg-zinc-900' : ''}`}
                      title={viewMode === 'grid' ? 'Visualização em Lista' : 'Visualização em Grade'}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setShowSearch(!showSearch)}
                      className={`p-2.5 rounded-full hover:bg-neutral-900 hover:text-white transition-all cursor-pointer ${showSearch ? 'text-white bg-zinc-900' : ''}`}
                      title="Pesquisar nos Arquivos"
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="p-2.5 rounded-full hover:bg-neutral-900 hover:text-white transition-all cursor-pointer text-slate-400"
                      title="Gerenciar Extensões Personalizadas"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Reset folder filter alert */}
                {selectedFolder && (
                  <div className="flex items-center justify-between text-xs bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-xl">
                    <span className="text-slate-300">Pasta filtrada por: <strong>{selectedFolder}</strong></span>
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className="text-zinc-300 hover:text-white hover:underline cursor-pointer font-bold text-[11px]"
                    >
                      Limpar filtro
                    </button>
                  </div>
                )}

                {/* LOCAL VIDEO LIST RENDER */}
                <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {searchFilteredFiles.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-600 border border-dashed border-neutral-900 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <Film className="w-8 h-8 text-neutral-800" />
                      <span>Nenhum vídeo local correspondente nesta pasta.</span>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
                      {searchFilteredFiles.map((f, i) => {
                        const isCurrent = currentFile && f.name === currentFile.name;
                        
                        // Render standard layout based on viewMode list vs grid
                        if (viewMode === 'grid') {
                          return (
                            <div
                              key={f.name}
                              onClick={() => selectFileToPlay(f)}
                              className={`flex flex-col p-2.5 rounded-2xl transition-all cursor-pointer border relative group ${
                                isCurrent
                                  ? 'bg-zinc-900/60 border-zinc-500'
                                  : 'bg-[#020205] border-transparent hover:bg-neutral-950/60'
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className={`w-full aspect-video rounded-xl overflow-hidden relative border border-zinc-800 flex items-center justify-center font-bold text-[11px] text-white bg-gradient-to-br ${getThumbnailGradient(i)} shrink-0 select-none group/thumb`}>
                                <video
                                  src={f.url}
                                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/thumb:scale-105 transition-transform duration-300 pointer-events-none"
                                  preload="none"
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 bg-black/25 group-hover/thumb:bg-black/10 transition-colors" />
                                <span className="absolute top-1.5 left-1.5 uppercase tracking-wider text-[8px] font-mono px-1.5 py-0.5 bg-black/60 rounded font-bold text-white">
                                  {f.extension.replace('.', '')}
                                </span>
                                <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 bg-[#000000]/80 text-[10px] font-medium font-mono text-slate-300 rounded-md">
                                  {formatTime(f.duration || 120)}
                                </div>
                                {isCurrent && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                                    <div className="p-2 bg-white text-black rounded-full scale-110 shadow-lg shadow-white/5">
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5 animate-pulse" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Title and metadata */}
                              <div className="mt-2 text-left relative pr-6">
                                <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isCurrent ? 'text-white font-bold' : 'text-slate-100'}`}>
                                  {f.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                  {formatTime(f.duration || 120)} • {f.sizeMB ? `${f.sizeMB} MB` : '181 KB'}
                                </p>
                                
                                <button
                                  onClick={(e) => handleDeleteFile(e, f.name)}
                                  className="absolute bottom-0 right-0 p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                  title="Remover vídeo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Premium Exact Screenshot Row Style layout
                        return (
                          <div
                            key={f.name}
                            onClick={() => selectFileToPlay(f)}
                            className={`flex gap-3.5 p-2 rounded-2xl transition-all cursor-pointer border relative group ${
                              isCurrent
                                ? 'bg-zinc-900/60 border-zinc-500'
                                : 'bg-[#020205] border-transparent hover:bg-neutral-950/60'
                            }`}
                          >
                            {/* Left Thumbnail (Copied aspect ratio from pixel) */}
                            <div className={`w-28 sm:w-32 aspect-video rounded-xl overflow-hidden relative border border-zinc-800 flex items-center justify-center font-bold text-[11px] text-white bg-gradient-to-br ${getThumbnailGradient(i)} shrink-0 shadow select-none group/thumb`}>
                              <video
                                src={f.url}
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/thumb:scale-105 transition-transform duration-300 pointer-events-none"
                                preload="none"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/25 group-hover/thumb:bg-black/10 transition-colors" />
                              <span className="absolute top-1.5 left-1.5 uppercase tracking-wider text-[8px] font-mono px-1.5 py-0.5 bg-black/60 rounded font-bold text-white">
                                {f.extension.replace('.', '')}
                              </span>
                              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-[#000000]/85 text-[10px] font-semibold font-mono text-slate-200 rounded-md select-none">
                                {formatTime(f.duration || 120)}
                              </div>
                              {isCurrent && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                                  <div className="p-2 bg-white text-black rounded-full scale-110 shadow-lg shadow-white/5">
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5 animate-pulse" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Description Row exactly styled as screenshot */}
                            <div className="flex flex-col justify-center min-w-0 flex-1 text-left select-none relative pr-8">
                              <p className={`text-[12.5px] font-medium leading-tight truncate-two-lines select-text ${isCurrent ? 'text-white font-bold' : 'text-slate-200'}`}>
                                {f.name}
                              </p>
                              
                              <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px] text-slate-500">
                                <span>{formatTime(f.duration || 120)}</span>
                                <span className="ml-auto select-text">{f.sizeMB ? `${f.sizeMB.toString().replace('.', ',')} MB` : '181 KB'}</span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteFile(e, f.name)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                title="Remover vídeo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* PASTAS (FOLDERS) GROUPS VIEW */}
            {activeTab === 'folders' && (
              <motion.div
                key="folders"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="bg-[#000000] border border-neutral-900 rounded-3xl p-5 flex flex-col gap-4"
              >
                
                <div>
                  <h2 className="text-3xl font-normal tracking-tight text-white select-none">
                    Pastas
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-1 uppercase tracking-widest font-mono select-none">
                    {getFolderGroups().length} diretórios locais mapeados
                  </p>
                </div>

                {/* Folder lists groups */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {getFolderGroups().map((fold) => (
                    <div
                      key={fold.name}
                      onClick={() => {
                        setSelectedFolder(fold.name);
                        setActiveTab('videos');
                      }}
                      className="bg-[#020205] border border-neutral-900/40 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-neutral-950 border-transparent transition-all cursor-pointer hover:border-zinc-800"
                    >
                      <div className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl relative">
                        <Folder className="w-6 h-6" />
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-black font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md">
                          {fold.count}
                        </span>
                      </div>

                      <div className="text-left select-none">
                        <p className="font-semibold text-sm text-slate-200 capitalize">
                          {fold.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {fold.totalSize} MB acumulado
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}

            {/* SUBTITLES STYLING & FINE TUNING */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="bg-[#000000] border border-neutral-900 rounded-3xl p-5 flex flex-col gap-4 text-left"
              >
                
                <div>
                  <h2 className="text-3xl font-normal tracking-tight text-white select-none">
                    Legendas e Ajustes
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-1 uppercase tracking-widest font-mono">
                    Estilização Offline e Correção de Legenda
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Colors block override */}
                  <div>
                    <span className="block font-semibold text-slate-500 mb-2 uppercase text-[10px] tracking-widest font-mono">Cor do Texto da Legenda</span>
                    <div className="flex items-center gap-3">
                      {[
                        { color: '#ffffff', label: 'Branco Neve' },
                        { color: '#eab308', label: 'Amarelo Ouro' },
                        { color: '#3b82f6', label: 'Azul Trovão' },
                        { color: '#22c55e', label: 'Verde Radium animate' },
                        { color: '#f43f5e', label: 'Alerta Rosa' }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => setSubtitleStyle({ ...subtitleStyle, textColor: item.color })}
                          className={`w-7 h-7 rounded-full border transition-all cursor-pointer ${
                            subtitleStyle.textColor === item.color
                              ? 'border-white scale-125 ring-2 ring-white shadow-md shadow-white/5'
                              : 'border-neutral-800'
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Size override */}
                  <div>
                    <span className="block font-semibold text-slate-500 mb-2 uppercase text-[10px] tracking-widest font-mono">Tamanho da Fonte</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="12"
                        max="26"
                        value={subtitleStyle.fontSize}
                        onChange={e => setSubtitleStyle({ ...subtitleStyle, fontSize: parseInt(e.target.value) })}
                        className="flex-1 h-1 bg-neutral-900 accent-white rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-xs text-white font-semibold">{subtitleStyle.fontSize}px</span>
                    </div>
                  </div>

                  {/* Subtitle Font Family selector */}
                  <div>
                    <span className="block font-semibold text-slate-500 mb-2 uppercase text-[10px] tracking-widest font-mono">Estilo Tipográfico</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { font: 'Inter', label: 'Sans-Serif Limpo' },
                        { font: 'JetBrains Mono', label: 'Mono Técnico' }
                      ].map((item) => (
                        <button
                          key={item.font}
                          onClick={() => setSubtitleStyle({ ...subtitleStyle, fontFamily: item.font })}
                          className={`py-2 px-3 text-[10.5px] rounded-xl border transition-all text-center cursor-pointer ${
                            subtitleStyle.fontFamily === item.font
                              ? 'bg-white border-white text-black font-bold'
                              : 'bg-black border-neutral-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual timing lag offset corrections */}
                  <div className="pt-2 border-t border-neutral-900">
                    <span className="block font-semibold text-slate-500 mb-2.5 uppercase text-[10px] tracking-widest font-mono">Correção de Sincronismo</span>
                    
                    <div className="bg-[#0a0a0a] p-3 rounded-xl text-center border border-zinc-850 mb-3 select-none">
                      <p className="text-[9px] font-mono text-slate-600 uppercase">Atraso Corrente</p>
                      <p className={`text-xl font-bold font-mono ${subtitleDelay === 0 ? 'text-slate-200' : subtitleDelay > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {subtitleDelay > 0 ? `+${subtitleDelay.toFixed(1)}` : subtitleDelay.toFixed(1)} segundos
                      </p>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setSubtitleDelay(prev => prev - 0.5)}
                        className="flex-1 py-2 bg-[#020205] border border-neutral-900 hover:border-zinc-700 rounded-xl text-slate-300 font-medium text-xs cursor-pointer text-center"
                      >
                        -0.5s (Adiantar)
                      </button>
                      <button
                        onClick={() => setSubtitleDelay(0)}
                        className="px-3.5 py-2 bg-[#020205] border border-neutral-900 text-slate-400 text-xs cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setSubtitleDelay(prev => prev + 0.5)}
                        className="flex-1 py-2 bg-[#020205] border border-neutral-900 hover:border-zinc-700 rounded-xl text-slate-300 font-medium text-xs cursor-pointer text-center"
                      >
                        +0.5s (Atrasar)
                      </button>
                    </div>
                  </div>

                  {/* Perfil de Desempenho Block */}
                  <div className="pt-2 border-t border-neutral-900">
                    <span className="block font-semibold text-slate-500 mb-2.5 uppercase text-[10px] tracking-widest font-mono">Perfil de Desempenho</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'eco', label: 'Econômico', desc: 'Economia de Bateria', icon: Battery },
                        { id: 'balanced', label: 'Balanceado', desc: 'Modo Balanceado', icon: BatteryCharging },
                        { id: 'extreme', label: 'Extremo', desc: 'Desempenho Extremo', icon: Zap }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = performanceProfile === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPerformanceProfile(item.id as PerformanceProfile);
                              triggerGestureFeedback('zoom', `Modo: ${item.desc}`);
                              if (item.id === 'extreme') {
                                setDecoderMode('HW+');
                              } else if (item.id === 'eco') {
                                setDecoderMode('SW');
                              } else {
                                setDecoderMode('HW');
                              }
                            }}
                            className={`py-3 px-1.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer select-none ${
                              isActive
                                ? 'bg-white border-white text-black font-bold shadow-md'
                                : 'bg-[#020205] border-neutral-900 text-slate-400 hover:text-white hover:border-neutral-800'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] leading-tight font-sans font-semibold">{item.label}</span>
                              <span className={`text-[8.5px] font-normal leading-normal font-sans opacity-70 mt-0.5 ${isActive ? 'text-zinc-700 font-medium' : 'text-slate-500'}`}>
                                {item.id === 'eco' ? 'Bateria' : item.id === 'balanced' ? 'Padrão' : 'Aceleração'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Restoration */}
                  <button
                    onClick={() => {
                      setSubtitleStyle({
                        fontFamily: 'Inter',
                        fontSize: 16,
                        textColor: '#ffffff',
                        shadowColor: '#000000',
                        backgroundColor: 'rgba(5, 8, 20, 0.85)',
                        backgroundOpacity: 0.85,
                        verticalOffset: 12,
                        isBold: true,
                        shadowBlur: 4
                      });
                      setSubtitleDelay(0);
                      setPerformanceProfile('balanced');
                      setDecoderMode('HW');
                      triggerGestureFeedback('zoom', 'Configurações redefinidas');
                    }}
                    className="w-full py-2 bg-[#020205] hover:bg-neutral-950 hover:text-white border border-neutral-900 transition-all rounded-xl text-[10.5px] font-bold font-mono text-slate-500 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Redefinir Estilos
                  </button>

                </div>

              </motion.div>
            )}
            </AnimatePresence>

            {/* STEADY BOTTOM BAR DEVICE CONTROLLER (EXACT REPLICA FROM SCREENSHOT) */}
            <div className="bg-[#000000] border-t border-[#111827] pt-2 mt-2">
              <div className="flex justify-around items-center w-full max-w-sm mx-auto">
                <button
                  onClick={() => {
                    setActiveTab('videos');
                    setSelectedFolder(null);
                  }}
                  className="flex flex-col items-center gap-1.5 py-2 px-6 transition-all relative cursor-pointer group"
                >
                  <span className={`text-[12.5px] font-medium transition-all ${activeTab === 'videos' ? 'text-white font-bold scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    Vídeos
                  </span>
                  {activeTab === 'videos' && (
                    <div className="absolute bottom-0 w-8 h-[2.5px] bg-white rounded-full animate-fade-in" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('folders')}
                  className="flex flex-col items-center gap-1.5 py-2 px-6 transition-all relative cursor-pointer group"
                >
                  <span className={`text-[12.5px] font-medium transition-all ${activeTab === 'folders' ? 'text-white font-bold scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    Pastas
                  </span>
                  {activeTab === 'folders' && (
                    <div className="absolute bottom-0 w-8 h-[2.5px] bg-white rounded-full animate-fade-in" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex flex-col items-center gap-1.5 py-2 px-6 transition-all relative cursor-pointer group"
                >
                  <span className={`text-[12.5px] font-medium transition-all ${activeTab === 'settings' ? 'text-white font-bold scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    Ajustes
                  </span>
                  {activeTab === 'settings' && (
                    <div className="absolute bottom-0 w-8 h-[2.5px] bg-white rounded-full animate-fade-in" />
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* FLOATING PICTURE-IN-PICTURE INTERACTION BOX */}
      {isFloatingPip && (
         <div className="fixed bottom-6 right-6 w-72 sm:w-80 aspect-video bg-zinc-950/95 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-white/5 z-[9999] flex flex-col group/float animate-fade-in pointer-events-auto">
           {/* Close bar / header */}
           <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-2 z-[20] flex items-center justify-between opacity-0 group-hover/float:opacity-100 transition-opacity duration-200">
             <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[70%] drop-shadow-sm font-sans">{currentFile?.name || 'Sem vídeo'}</span>
             <div className="flex items-center gap-1">
               <button
                 onClick={() => setIsFloatingPip(false)}
                 className="p-1 rounded bg-black/60 text-slate-300 hover:text-white cursor-pointer"
                 title="Restaurar Player"
               >
                 <Maximize2 className="w-3 h-3" />
               </button>
               <button
                 onClick={() => {
                   setIsPlaying(false);
                   setIsFloatingPip(false);
                 }}
                 className="p-1 rounded bg-black/60 text-rose-400 hover:text-rose-300 cursor-pointer"
                 title="Fechar"
               >
                 <X className="w-3 h-3" />
               </button>
             </div>
           </div>

           {/* Video render */}
           <video
             ref={floatingVideoRef}
             loop={isLooping}
             onTimeUpdate={() => {
               if (floatingVideoRef.current) {
                 setCurrentTime(floatingVideoRef.current.currentTime);
               }
             }}
             onLoadedMetadata={() => {
               if (floatingVideoRef.current) {
                 setDuration(floatingVideoRef.current.duration); floatingVideoRef.current.playbackRate = playbackSpeed;
               }
             }}
             playsInline
             className="w-full h-full object-cover bg-black"
           />

           {/* Floating controls overlays */}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/float:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 z-[10]">
             <button
               onClick={() => {
                 if (floatingVideoRef.current) {
                   floatingVideoRef.current.currentTime = Math.max(0, currentTime - 10);
                 }
               }}
               className="p-1.5 bg-black/75 rounded-full hover:bg-neutral-900 border border-white/5 text-blue-400 hover:text-white cursor-pointer"
               title="Retroceder 10s"
             >
               <RotateCcw className="w-3.5 h-3.5 transform -scale-x-100" />
             </button>
             <button
               onClick={handlePlayPause}
               className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow shadow-blue-500/30 cursor-pointer"
               title={isPlaying ? 'Pausar' : 'Reproduzir'}
             >
               {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
             </button>
             <button
               onClick={() => {
                 if (floatingVideoRef.current) {
                   floatingVideoRef.current.currentTime = Math.min(duration, currentTime + 10);
                 }
               }}
               className="p-1.5 bg-black/75 rounded-full hover:bg-neutral-900 border border-white/5 text-blue-400 hover:text-white cursor-pointer"
               title="Avançar 10s"
             >
               <RotateCcw className="w-3.5 h-3.5" />
             </button>
           </div>

           {/* Small micro timeline bar */}
           <div className="absolute bottom-0 inset-x-0 h-1 bg-black/50 z-[20]">
             <div 
               className="h-full bg-blue-600 transition-all duration-300"
               style={{ width: `${(currentTime / (duration || 120)) * 100}%` }}
             />
           </div>
         </div>
      )}

     {/* Animated Splash Screen Loading Overlay */}
      <AnimatePresence>
        {isSplashLoading && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#020205] z-[999999] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Glowing ambient pulse circle */}
            <div className="absolute w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center gap-6 z-10"
            >
              <div className="p-5 bg-white text-black rounded-3xl flex items-center justify-center shadow-2xl relative border border-white/5">
                <Film className="w-12 h-12 text-black animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-white uppercase font-display">
                  Radium <span className="text-zinc-500">Player</span>
                </h1>
                <p className="text-[11px] text-zinc-500 font-mono tracking-widest uppercase">
                  Alta Performance & Decodificação
                </p>
              </div>

              {/* Loader strip bar */}
              <div className="w-52 h-1 bg-zinc-900 rounded-full overflow-hidden relative border border-zinc-800">
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-indigo-500 absolute rounded-full"
                />
              </div>

              <p className="text-xs text-zinc-400 font-mono italic animate-pulse mt-1">
                Inicializando decodificadores gráficos de alta fidelidade...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Extensions Modals Overlay */}
      <AnimatePresence>
        {showExtensionModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-md bg-[#0a0a0c] border border-zinc-800 rounded-3xl p-6 text-left relative shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Extensões de Vídeo</h3>
                    <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">Formatos suportados pelo app</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddExtension} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: .avi, .mov, .flv"
                  value={newExtensionInput}
                  onChange={(e) => setNewExtensionInput(e.target.value)}
                  className="flex-1 bg-black text-sm text-slate-200 border border-zinc-800 rounded-xl px-3.5 py-2 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </form>

              {/* List of currently allowed extensions */}
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-bold">Extensões Ativas ({allowedExtensions.length})</span>
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto p-1 bg-black/40 border border-zinc-900 rounded-xl">
                  {allowedExtensions.map((ext) => {
                    const isDefault = ['.mp4', '.mkv', '.webm'].includes(ext);
                    return (
                      <div
                        key={ext}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono select-none ${
                          isDefault
                            ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
                            : 'bg-indigo-950/20 border-indigo-900/60 text-indigo-200'
                        }`}
                      >
                        <span>{ext}</span>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtension(ext)}
                            className="p-0.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            title="Remover extensão"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {isDefault && (
                          <span className="text-[8px] uppercase tracking-widest text-[#22c55e] font-bold">Padrão</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer notice */}
              <p className="text-[10px] text-zinc-600 leading-relaxed font-sans">
                * Adicionar novos formatos permite que a caixa de arquivos de mídia mostre esses arquivos para seleção. A capacidade real de decodificação de áudio/vídeo ainda dependerá de seu navegador nativo e dos codecs instalados no sistema operacional.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
