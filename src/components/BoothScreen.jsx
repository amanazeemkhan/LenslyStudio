import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Video, Zap, Timer, Sparkles, X, Layout, SwitchCamera, MoreVertical } from 'lucide-react';
import { POSES, FILTERS } from '../utils/constants';

// --- BOOTH SCREEN (Camera & Capture) ---
export default function BoothScreen({ mode, setMode, onCaptureComplete, onBack, retakeIndex }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [hasPermission, setHasPermission] = useState(null);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [isCounting, setIsCounting] = useState(false);
  const [count, setCount] = useState(3);
  const [flash, setFlash] = useState(false);
  const [currentPose, setCurrentPose] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const [showPoseModal, setShowPoseModal] = useState(false); 
  const [captureProgress, setCaptureProgress] = useState(0); 
  const [countdownDuration, setCountdownDuration] = useState(3); 
  const [facingMode, setFacingMode] = useState('user'); 
  
  const [showTopSettings, setShowTopSettings] = useState(false);

  const isRetaking = retakeIndex !== null;

  // Initialize Camera
  useEffect(() => {
    let isMounted = true;
    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false 
        });
        if (!isMounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied:", err);
        if (isMounted) setHasPermission(false);
      }
    }
    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  // Keyboard Shortcut for Spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); 
        if (!isCounting && captureProgress === 0) {
          document.getElementById('capture-btn')?.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCounting, captureProgress]);

  const captureSingleFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.filter = filter.canvas;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const runCountdown = (duration = 3) => {
    return new Promise(resolve => {
      setIsCounting(true);
      setCount(duration);
      if (challengeMode) {
        setCurrentPose(POSES[Math.floor(Math.random() * POSES.length)]);
      }

      let current = duration;
      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setCount(current);
        } else {
          clearInterval(interval);
          setIsCounting(false);
          triggerFlash();
          resolve();
        }
      }, 1000);
    });
  };

  const handleCapture = async () => {
    if (mode === 'gif' && !isRetaking) {
      chunksRef.current = [];
      const stream = streamRef.current;
      const options = { mimeType: 'video/webm' };
      try {
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          onCaptureComplete([], true, blob);
        };

        await runCountdown(countdownDuration);
        await new Promise(r => setTimeout(r, 600)); 
        
        mediaRecorder.start();
        setCaptureProgress(1); 
        setTimeout(() => {
          if(mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          setCaptureProgress(0);
        }, 3000); 
      } catch (e) {
        console.error("MediaRecorder error", e);
        alert("Video recording not supported in this browser.");
      }

    } else {
      const numPhotos = isRetaking ? 1 : (mode === 'strip' || mode === 'grid' ? 4 : 1);
      const captures = [];
      
      for (let i = 0; i < numPhotos; i++) {
        setCaptureProgress(i + 1);
        await runCountdown(countdownDuration);
        const frame = captureSingleFrame();
        if (frame) captures.push(frame);
        
        if (i < numPhotos - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      setCaptureProgress(0);
      onCaptureComplete(captures, false, null);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-900 text-white">
        <div className="bg-red-500/20 p-6 rounded-full mb-6">
          <Camera size={48} className="text-red-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Camera Access Required</h2>
        <p className="text-white/70 max-w-md mb-8">
          Please allow camera access in your browser settings to use the photo booth. We process everything locally in your browser!
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black relative overflow-hidden">
      
      {/* Invisible overlay to close dropdown when clicking outside (Z-40) */}
      {showTopSettings && (
        <div 
          className="absolute inset-0 z-40" 
          onPointerDown={() => setShowTopSettings(false)}
        />
      )}

      {/* TOP HEADER CONTROLS (Z-50: Now safely above the invisible overlay!) */}
      <div className="absolute top-0 inset-x-0 z-50 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-10">
        
        <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur transition-colors shrink-0 shadow-lg text-white">
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-lg overflow-x-auto scrollbar-hide max-w-[60vw]">
          {isRetaking ? (
            <div className="px-4 py-2 text-pink-400 font-bold text-sm tracking-wide uppercase whitespace-nowrap">
              Retaking Photo #{retakeIndex + 1}
            </div>
          ) : (
            [
              { id: 'strip', icon: Layout, label: 'Strip' },
              { id: 'single', icon: ImageIcon, label: 'Single' },
              { id: 'meme', icon: Zap, label: 'Meme' },
              { id: 'gif', icon: Video, label: 'GIF' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-full text-sm font-medium transition-all shrink-0 ${mode === m.id ? 'bg-white text-black shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <m.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))
          )}
        </div>
        
        <div className="relative shrink-0">
          <button 
            onPointerDown={(e) => {
              e.stopPropagation();
              setShowTopSettings(!showTopSettings);
            }}
            className={`p-3 rounded-full backdrop-blur transition-all border shadow-lg flex items-center justify-center ${showTopSettings ? 'bg-white text-black border-white' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'}`}
          >
            <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Settings Dropdown Container */}
          {showTopSettings && (
            <div 
              onPointerDown={(e) => e.stopPropagation()} // Prevents clicks from hitting the overlay
              className="absolute top-full right-0 mt-3 w-48 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 origin-top-right animate-in fade-in zoom-in-95 text-white"
            >
              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <div className="bg-white/10 p-1.5 rounded-full"><SwitchCamera className="w-4 h-4 text-white" /></div>
                <span className="text-sm font-medium">Flip Camera</span>
              </button>

              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setCountdownDuration(d => d === 3 ? 5 : 3);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <div className={`p-1.5 rounded-full transition-colors ${countdownDuration === 5 ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white'}`}>
                  <Timer className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium transition-all">Timer: {countdownDuration}s</span>
              </button>

              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setShowPoseModal(true); 
                  setShowTopSettings(false); 
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <div className={`p-1.5 rounded-full ${challengeMode ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">Pose Challenge</span>
                  <span className="text-[10px] text-white/50 leading-tight">{challengeMode ? 'Enabled' : 'Disabled'}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CAMERA FEED AREA */}
      <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-gray-900 z-10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`h-full w-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
          style={{ filter: filter.css }}
        />

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-100 ease-in-out z-50 ${flash ? 'opacity-100' : 'opacity-0'}`} />

        {isCounting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/40 backdrop-blur-sm">
            {challengeMode && currentPose && (
              <div className="mb-8 px-8 py-4 bg-pink-500 text-white text-2xl md:text-4xl font-black uppercase tracking-wider rounded-2xl transform -rotate-2 animate-pulse shadow-2xl text-center">
                {currentPose}
              </div>
            )}
            <div className="text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.6)] animate-ping-short">
              {count}
            </div>
          </div>
        )}

        {mode === 'gif' && !isRetaking && captureProgress === 1 && !isCounting && (
          <div className="absolute top-24 right-8 flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full animate-pulse z-40">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="font-bold text-sm tracking-widest">REC</span>
          </div>
        )}

        {mode === 'strip' && !isRetaking && captureProgress > 0 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`w-3 h-3 rounded-full transition-all ${step < captureProgress ? 'bg-white' : step === captureProgress ? 'bg-pink-400 scale-150 shadow-[0_0_10px_#f472b6]' : 'bg-white/30'}`} />
            ))}
          </div>
        )}

        {/* MODERN FILTER SLIDER */}
        <div className="absolute bottom-6 inset-x-0 z-30 w-full overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center md:justify-center gap-3 px-6 md:px-4 w-max min-w-full">
            {FILTERS.map(f => (
              <button
                key={f.name}
                onClick={() => setFilter(f)}
                className={`snap-center shrink-0 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold backdrop-blur-md transition-all border ${filter.name === f.name ? 'bg-white text-black border-white scale-105' : 'bg-black/40 text-white/90 border-white/20 hover:bg-black/60'}`}
              >
                {f.name}
              </button>
            ))}
            <div className="w-4 shrink-0 md:hidden" />
          </div>
        </div>
      </div>

      {/* SOLID BLACK BOTTOM DECK (Perfectly Centered Content) */}
      <div className="h-32 sm:h-36 bg-black shrink-0 w-full relative z-20 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <button 
            id="capture-btn"
            onClick={handleCapture}
            disabled={isCounting || (!isRetaking && captureProgress > 0 && mode !== 'strip')}
            className="relative group w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center focus:outline-none disabled:opacity-50 disabled:scale-100 transform active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 rounded-full border-4 border-white/50 group-hover:border-white transition-colors" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-black group-hover:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              {mode === 'gif' && !isRetaking ? <Video size={32} /> : <Camera size={32} />}
            </div>
          </button>
          
          {/* ADDED 'whitespace-nowrap' HERE */}
          <span className="text-[10px] sm:text-xs font-bold text-white/50 tracking-widest uppercase pointer-events-none whitespace-nowrap">
            Press Space
          </span>
          
        </div>
      </div>

      {/* Pose Challenge Modal (Z-60 to sit above everything) */}
      {showPoseModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-900 border border-white/20 p-8 rounded-3xl max-w-sm w-full relative text-center shadow-[0_0_50px_rgba(236,72,153,0.3)]">
            <button onClick={() => setShowPoseModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Pose Challenge</h3>
            <p className="text-white/70 mb-8 text-sm leading-relaxed">
              Spice up your photos! We'll give you a fun, random prompt (like "Fake laugh 😂") right before the camera flashes. Get ready!
            </p>
            <button 
              onClick={() => {
                setChallengeMode(!challengeMode);
                setShowPoseModal(false);
              }}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${challengeMode ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/20' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white shadow-lg shadow-pink-500/25'}`}
            >
              {challengeMode ? 'Turn Off Challenge' : 'Enable Challenge'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}