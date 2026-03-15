import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Download, Printer, Share2 } from 'lucide-react';

// --- RESULT SCREEN ---
export default function ResultScreen({ finalImage, gifBlob, onRetake, onHome }) {
  const [downloading, setDownloading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false); // Tracks playback readiness
  const gifUrl = gifBlob ? URL.createObjectURL(gifBlob) : null;

  // Simple Confetti Effect Setup
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#fbbf24', '#34d399'];
    const newParticles = Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 100,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
      speed: Math.random() * 3 + 2
    }));
    setParticles(newParticles);
    
    // Animation loop for confetti falling
    let animationFrame;
    const updateConfetti = () => {
      setParticles(prev => prev.map(p => {
        let newY = p.y + p.speed;
        let newRot = p.rotation + p.speed;
        if (newY > 120) newY = -10; // Reset to top
        return { ...p, y: newY, rotation: newRot };
      }));
      animationFrame = requestAnimationFrame(updateConfetti);
    };
    updateConfetti();
    
    // Stop after 5 seconds to save resources
    const timer = setTimeout(() => cancelAnimationFrame(animationFrame), 5000);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timer);
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    if (gifBlob) {
      link.href = gifUrl;
      link.download = `photobooth-${Date.now()}.webm`;
    } else {
      link.href = finalImage;
      link.download = `photobooth-${Date.now()}.jpg`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        if (gifBlob) {
           const file = new File([gifBlob], 'video.webm', { type: 'video/webm' });
           await navigator.share({ files: [file], title: 'My Booth Video' });
        } else {
          // fetch to convert data url to blob for Web Share API
          const res = await fetch(finalImage);
          const blob = await res.blob();
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          await navigator.share({
            title: 'My Photo Booth Pic',
            text: 'Check out my photo from the Virtual Booth!',
            files: [file]
          });
        }
      } catch (e) {
        console.log("Share failed", e);
      }
    } else {
      alert("Sharing not supported on this browser. Use download instead!");
    }
  };

  const handlePrint = () => {
    if (gifBlob) {
      alert("GIFs cannot be printed directly. Please save the video instead!");
      return;
    }
    
    // Use an invisible iframe to bypass popup blockers entirely 
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Photo - SnapBooth</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${finalImage}" onload="setTimeout(() => { window.focus(); window.print(); }, 250);" />
        </body>
      </html>
    `);
    doc.close();

    // Clean up the invisible iframe after 10 seconds to ensure the print dialog had time to open
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Confetti Render */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute z-0"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            backgroundColor: p.color, transform: `rotate(${p.rotation}deg)`,
            opacity: 0.8, borderRadius: p.id % 2 === 0 ? '50%' : '0'
          }}
        />
      ))}

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-3xl max-w-2xl w-full z-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400 mb-6 flex items-center gap-3">
          <Sparkles /> Looking Great! <Sparkles />
        </h2>

        {/* Media Display */}
        <div className="w-full h-[45vh] sm:h-[50vh] flex justify-center items-center mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
          
          <div className="relative w-full h-full flex justify-center items-center">
            {gifBlob ? (
              <>
                {/* Beautiful Animated Loading State to hide Video Encoder Glitches */}
                {!isVideoReady && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl transition-opacity duration-500">
                    <RefreshCw className="text-pink-400 animate-spin mb-4" size={32} />
                    <p className="text-white/80 font-bold tracking-widest uppercase text-sm animate-pulse">Polishing Loop...</p>
                  </div>
                )}
                <video 
                  src={gifUrl} 
                  loop 
                  muted 
                  playsInline 
                  preload="auto"
                  onLoadedData={(e) => {
                    // Skip the first 250ms to completely bypass the common MediaRecorder initialization glitch
                    if(e.target.currentTime < 0.2) {
                      e.target.currentTime = 0.25; 
                    }
                  }}
                  onSeeked={(e) => {
                    // Once seeking is finished, smoothly reveal the perfectly playing video
                    e.target.play().catch(() => {});
                    setTimeout(() => setIsVideoReady(true), 150);
                  }}
                  className={`h-full w-full object-contain rounded-xl shadow-2xl relative z-10 bg-transparent transition-all duration-700 ease-out ${isVideoReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} 
                />
              </>
            ) : (
              <img src={finalImage} alt="Final Layout" className="h-full w-full object-contain rounded-xl shadow-2xl relative z-10 bg-transparent animate-in fade-in duration-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <button 
            onClick={handleDownload}
            className="flex-1 min-w-[120px] py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm sm:text-base"
          >
            <Download size={18} /> {downloading ? 'Saved!' : 'Save'}
          </button>

          {!gifBlob && (
            <button 
              onClick={handlePrint}
              className="flex-1 min-w-[100px] py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 text-sm sm:text-base"
            >
              <Printer size={18} /> Print
            </button>
          )}
          
          <button 
            onClick={handleShare}
            className="flex-1 min-w-[100px] py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 text-sm sm:text-base"
          >
            <Share2 size={18} /> Share
          </button>
        </div>

        <div className="flex gap-4 w-full mt-4">
          <button 
            onClick={onRetake}
            className="flex-1 py-3 text-white/60 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={18} /> Take Another
          </button>
          <button 
            onClick={onHome}
            className="flex-1 py-3 text-white/60 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
             Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}