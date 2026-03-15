import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Video, Zap, Timer, Sparkles, X, Layout } from 'lucide-react';
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
  const [showPoseModal, setShowPoseModal] = useState(false); // Pose Modal State
  const [captureProgress, setCaptureProgress] = useState(0); // For strips
  const [countdownDuration, setCountdownDuration] = useState(3); // 3s or 5s
  
  const isRetaking = retakeIndex !== null;

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied:", err);
        setHasPermission(false);
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Keyboard Shortcut for Spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
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
    
    // Mirror the image horizontally just like the video preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    // Apply current filter to canvas
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
      // Record Video
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
        // Delay to ensure flash completely clears out before recording starts
        await new Promise(r => setTimeout(r, 600)); 
        
        mediaRecorder.start();
        setCaptureProgress(1); // Indicate recording
        setTimeout(() => {
          if(mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          setCaptureProgress(0);
        }, 3000); // 3 second GIF
      } catch (e) {
        console.error("MediaRecorder error", e);
        alert("Video recording not supported in this browser.");
      }

    } else {
      // Photo Capture Logic
      const numPhotos = isRetaking ? 1 : (mode === 'strip' || mode === 'grid' ? 4 : 1);
      const captures = [];
      
      for (let i = 0; i < numPhotos; i++) {
        setCaptureProgress(i + 1);
        await runCountdown(countdownDuration);
        const frame = captureSingleFrame();
        if (frame) captures.push(frame);
        
        // Short pause between shots if multiple
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
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
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
    <div className="h-screen w-full flex flex-col bg-black relative">
      {/* Header Controls */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur transition-colors">
          <X size={24} />
        </button>
        <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
          {isRetaking ? (
            <div className="px-4 py-2 text-pink-400 font-bold text-sm tracking-wide uppercase">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === m.id ? 'bg-white text-black shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <m.icon size={16} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Timer Toggle */}
          <button 
            onClick={() => setCountdownDuration(d => d === 3 ? 5 : 3)}
            className={`px-3 py-1.5 rounded-full backdrop-blur transition-all font-bold text-sm border flex items-center gap-1 ${countdownDuration === 5 ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'}`}
            title="Toggle Countdown Length"
          >
            <Timer size={16} /> {countdownDuration}s
          </button>

          <button 
            onClick={() => setShowPoseModal(true)}
            className={`p-2 rounded-full backdrop-blur transition-all ${challengeMode ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            title="Pose Challenge Mode"
          >
            <Sparkles size={24} />
          </button>
        </div>
      </div>

      {/* Main Camera View */}
      <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-gray-900 border-b border-white/10 z-10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="h-full w-full object-cover transform scale-x-[-1]"
          style={{ filter: filter.css }}
        />

        {/* Flash Overlay */}
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-100 ease-in-out z-50 ${flash ? 'opacity-100' : 'opacity-0'}`} />

        {/* Countdown Overlay */}
        {isCounting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/40 backdrop-blur-sm">
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

        {/* Recording Indicator */}
        {mode === 'gif' && !isRetaking && captureProgress === 1 && !isCounting && (
          <div className="absolute top-20 right-8 flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full animate-pulse z-20">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="font-bold text-sm tracking-widest">REC</span>
          </div>
        )}

        {/* Capture Progress for Strip */}
        {mode === 'strip' && !isRetaking && captureProgress > 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`w-3 h-3 rounded-full transition-all ${step < captureProgress ? 'bg-white' : step === captureProgress ? 'bg-pink-400 scale-150 shadow-[0_0_10px_#f472b6]' : 'bg-white/30'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Pose Challenge Modal */}
      {showPoseModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 p-8 rounded-3xl max-w-sm w-full relative text-center shadow-[0_0_50px_rgba(236,72,153,0.3)]">
            <button onClick={() => setShowPoseModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Pose Challenge</h3>
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

      {/* Bottom Controls */}
      <div className="h-56 bg-black w-full relative z-20 flex flex-col items-center justify-center px-4 pt-4 pb-6 gap-6">
        {/* Filter Selection - Centered & Aesthetic */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex md:justify-center gap-3 snap-x px-4 w-max md:w-full mx-auto">
            {FILTERS.map(f => (
              <button
                key={f.name}
                onClick={() => setFilter(f)}
                className={`snap-center shrink-0 px-5 py-2 rounded-full text-sm font-medium border-2 transition-all ${filter.name === f.name ? 'border-pink-500 text-pink-500 bg-pink-500/10' : 'border-white/20 text-white/60 hover:border-white/50 bg-black/50 backdrop-blur'}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Capture Button */}
        <div className="relative flex flex-col items-center">
          <button 
            id="capture-btn"
            onClick={handleCapture}
            disabled={isCounting || (!isRetaking && captureProgress > 0 && mode !== 'strip')}
            className="relative group w-20 h-20 flex items-center justify-center focus:outline-none disabled:opacity-50 disabled:scale-100 transform active:scale-95 transition-transform"
          >
            <div className="absolute inset-0 rounded-full border-4 border-white/50 group-hover:border-white transition-colors" />
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black group-hover:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {mode === 'gif' && !isRetaking ? <Video size={28} /> : <Camera size={28} />}
            </div>
          </button>
          {/* Spacebar Hint */}
          <span className="absolute -bottom-6 text-[10px] font-bold text-white/50 tracking-widest uppercase pointer-events-none">
            Press Space
          </span>
        </div>
      </div>
    </div>
  );
}