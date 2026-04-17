import React, { useState, useEffect, useCallback } from 'react';

// --- IMPORTING YOUR COMPONENTS ---
import LandingPage from './components/LandingPage';
import BoothScreen from './components/BoothScreen';
import EditorScreen from './components/EditorScreen';
import ResultScreen from './components/ResultScreen';

// --- MAIN APP COMPONENT ---
export default function VirtualPhotoBooth() {
  
  // 1. ALWAYS default to the landing page on a fresh load or refresh
  const [screen, setScreenState] = useState('landing');

  const setScreen = useCallback((newScreen) => {
    setScreenState(newScreen);
    if (window.location.pathname.replace('/', '') !== newScreen) {
      window.history.pushState(null, '', `/${newScreen}`);
    }
  }, []);

  useEffect(() => {
    // 2. On boot, if the URL is anything other than /landing, force it back to /landing
    if (window.location.pathname !== '/landing') {
      window.history.replaceState(null, '', '/landing');
    }

    // 3. Handle the browser's Back/Forward buttons safely
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (['landing', 'booth', 'editor', 'result'].includes(path)) {
        setScreenState(path);
      } else {
        setScreenState('landing');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [boothMode, setBoothMode] = useState('strip'); // strip, single, meme, gif
  const [capturedImages, setCapturedImages] = useState([]);
  const [gifVideoBlob, setGifVideoBlob] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [curtainAnim, setCurtainAnim] = useState('idle'); // idle, closed, opening
  
  // Single Image Retake State
  const [retakeIndex, setRetakeIndex] = useState(null);

  // Editor State
  const [editorElements, setEditorElements] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState('strip');

  // --- NEW: FILTER STATE FOR APPLE PROGRESSIVE ENHANCEMENT ---
  const [activeFilter, setActiveFilter] = useState(null);

  // --- THE ROUTE GUARD ---
  useEffect(() => {
    if (screen === 'editor' || screen === 'result') {
      // Check if we are missing both standard photos AND gif blobs
      if (capturedImages.length === 0 && !gifVideoBlob && !finalImage) {
        setScreen('landing');
      }
    }
  }, [screen, capturedImages, gifVideoBlob, finalImage, setScreen]);

  const resetBooth = () => {
    setCapturedImages([]);
    setGifVideoBlob(null);
    setFinalImage(null);
    setEditorElements([]);
    setRetakeIndex(null);
    setActiveFilter(null); // Reset the filter state here!
    setScreen('booth');
  };

  const handleStartBooth = () => {
    // Snap closed instantly
    setCurtainAnim('closed');
    setScreen('booth');
    
    // Hold the closed curtain for 400ms so the user actually sees it
    setTimeout(() => {
      setCurtainAnim('opening');
      // Wait 1000ms for the elegant sweeping animation to finish
      setTimeout(() => setCurtainAnim('idle'), 1000);
    }, 400); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden selection:bg-pink-500 selection:text-white relative">
      {/* Injecting Beautiful Google Fonts */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Oswald:wght@700&family=Pacifico&family=Poppins:wght@700&display=swap');`}
      </style>

      {/* Stage Curtain Transition Overlay (Perfect Top-Anchored Sweep) */}
      {curtainAnim !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex pointer-events-none overflow-hidden">
          {/* Left Curtain */}
          <div 
            className={`absolute top-0 left-0 h-[120%] w-[55%] bg-gradient-to-r from-red-900 via-red-700 to-red-800 border-r-[12px] border-red-950 shadow-[10px_0_30px_rgba(0,0,0,0.8)] origin-top-left transition-all ease-in-out ${curtainAnim === 'opening' ? 'duration-[1000ms]' : 'duration-0'}`}
            style={{
              transform: curtainAnim === 'closed' ? 'scaleX(1) skewX(0deg)' : 'scaleX(0.05) skewX(-30deg)',
              borderBottomRightRadius: curtainAnim === 'closed' ? '0px' : '100% 100%'
            }}
          />
          {/* Right Curtain */}
          <div 
            className={`absolute top-0 right-0 h-[120%] w-[55%] bg-gradient-to-l from-red-900 via-red-700 to-red-800 border-l-[12px] border-red-950 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] origin-top-right transition-all ease-in-out ${curtainAnim === 'opening' ? 'duration-[1000ms]' : 'duration-0'}`}
            style={{
              transform: curtainAnim === 'closed' ? 'scaleX(1) skewX(0deg)' : 'scaleX(0.05) skewX(30deg)',
              borderBottomLeftRadius: curtainAnim === 'closed' ? '0px' : '100% 100%'
            }}
          />
        </div>
      )}

      {screen === 'landing' && <LandingPage onStart={handleStartBooth} />}
      
      {screen === 'booth' && (
        <BoothScreen 
          mode={boothMode} 
          setMode={setBoothMode} 
          retakeIndex={retakeIndex}
          // Catching the 4th parameter (filterUsed) here!
          onCaptureComplete={(images, isGif, blob, filterUsed) => {
            if (isGif) {
              setGifVideoBlob(blob);
              setActiveFilter(filterUsed); // Save active filter
              setScreen('result');
            } else if (retakeIndex !== null) {
              const newImages = [...capturedImages];
              newImages[retakeIndex] = images[0];
              setCapturedImages(newImages);
              setActiveFilter(filterUsed); // Save active filter
              setRetakeIndex(null);
              setScreen('editor');
            } else {
              setCapturedImages(images);
              setActiveFilter(filterUsed); // Save active filter
              setSelectedLayout(
                boothMode === 'strip' ? 'strip' : 
                boothMode === 'meme' ? 'single' : 
                boothMode === 'single' ? 'single' : 'grid'
              );
              
              if (boothMode === 'meme') {
                setEditorElements([
                  { id: Date.now() + 1, type: 'text', content: 'TOP TEXT', x: 50, y: 15, scale: 2, color: '#ffffff', isMeme: true, fontFamily: 'Impact, sans-serif' },
                  { id: Date.now() + 2, type: 'text', content: 'BOTTOM TEXT', x: 50, y: 85, scale: 2, color: '#ffffff', isMeme: true, fontFamily: 'Impact, sans-serif' }
                ]);
              }
              setScreen('editor');
            }
          }}
          onBack={() => {
            if (retakeIndex !== null) {
              setRetakeIndex(null);
              setScreen('editor');
            } else {
              setScreen('landing');
            }
          }}
        />
      )}
      
      {screen === 'editor' && (
        <EditorScreen 
          images={capturedImages} 
          layout={selectedLayout}
          setLayout={setSelectedLayout}
          elements={editorElements}
          setElements={setEditorElements}
          activeFilter={activeFilter} // Passing it securely to the Editor!
          onDone={(finalDataUrl) => {
            setFinalImage(finalDataUrl);
            setScreen('result');
          }}
          onRetake={resetBooth}
          onRetakeSingle={(index, currentExpandedImages) => {
            setCapturedImages(currentExpandedImages);
            setRetakeIndex(index);
            setScreen('booth');
          }}
        />
      )}

      {screen === 'result' && (
        <ResultScreen 
          finalImage={finalImage} 
          gifBlob={gifVideoBlob}
          onRetake={resetBooth}
          onHome={() => {
            resetBooth();
            setScreen('landing');
          }}
        />
      )}
    </div>
  );
}