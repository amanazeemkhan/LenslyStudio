import React, { useState } from 'react';

// --- IMPORTING YOUR NEW COMPONENTS ---
import LandingPage from './components/LandingPage';
import BoothScreen from './components/BoothScreen';
import EditorScreen from './components/EditorScreen';
import ResultScreen from './components/ResultScreen';

// --- MAIN APP COMPONENT ---
export default function VirtualPhotoBooth() {
  const [screen, setScreen] = useState('landing'); // landing, booth, editor, result
  const [boothMode, setBoothMode] = useState('strip'); // strip, single, meme, gif
  const [capturedImages, setCapturedImages] = useState([]);
  const [gifVideoBlob, setGifVideoBlob] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [curtainAnim, setCurtainAnim] = useState('idle'); // idle, closing, opening
  
  // Single Image Retake State
  const [retakeIndex, setRetakeIndex] = useState(null);

  // Editor State
  const [editorElements, setEditorElements] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState('strip');

  const resetBooth = () => {
    setCapturedImages([]);
    setGifVideoBlob(null);
    setFinalImage(null);
    setEditorElements([]);
    setRetakeIndex(null);
    setScreen('booth');
  };

  const handleStartBooth = () => {
    setCurtainAnim('closing');
    setTimeout(() => {
      setScreen('booth');
      setCurtainAnim('opening');
      setTimeout(() => setCurtainAnim('idle'), 700);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden selection:bg-pink-500 selection:text-white relative">
      {/* Injecting Beautiful Google Fonts */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Oswald:wght@700&family=Pacifico&family=Poppins:wght@700&display=swap');`}
      </style>

      {/* Red Velvet Curtain Transition Overlay */}
      {curtainAnim !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex pointer-events-none">
          <div className={`h-full bg-gradient-to-r from-red-900 via-red-700 to-red-800 transition-all duration-700 ease-in-out ${curtainAnim === 'closing' ? 'w-1/2' : 'w-0'} border-r-8 border-red-950 shadow-[5px_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden`}></div>
          <div className={`h-full bg-gradient-to-l from-red-900 via-red-700 to-red-800 transition-all duration-700 ease-in-out ${curtainAnim === 'closing' ? 'w-1/2' : 'w-0'} border-l-8 border-red-950 shadow-[-5px_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden ml-auto`}></div>
        </div>
      )}

      {screen === 'landing' && <LandingPage onStart={handleStartBooth} />}
      
      {screen === 'booth' && (
        <BoothScreen 
          mode={boothMode} 
          setMode={setBoothMode} 
          retakeIndex={retakeIndex}
          onCaptureComplete={(images, isGif, blob) => {
            if (isGif) {
              setGifVideoBlob(blob);
              setScreen('result');
            } else if (retakeIndex !== null) {
              // Replace just the specific image in the array
              const newImages = [...capturedImages];
              newImages[retakeIndex] = images[0];
              setCapturedImages(newImages);
              setRetakeIndex(null);
              setScreen('editor');
            } else {
              setCapturedImages(images);
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
          onDone={(finalDataUrl) => {
            setFinalImage(finalDataUrl);
            setScreen('result');
          }}
          onRetake={resetBooth}
          onRetakeSingle={(index, currentExpandedImages) => {
            setCapturedImages(currentExpandedImages); // solidify layout repeating structure
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