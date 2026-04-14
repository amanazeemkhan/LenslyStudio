import React, { useState } from 'react';
import { Aperture, Camera, ChevronRight, Layout, Smile, Video, Zap, X, Settings, Sparkles, Wand2 } from 'lucide-react';

export default function LandingPage({ onStart }) {
  const [activeModal, setActiveModal] = useState(null); // 'how' or 'features'

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
      </div>
      
      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-12">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter">
          <Aperture className="text-pink-400" size={32} />
          <span>Lensly<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Studio</span></span>
        </div>
        <div className="hidden md:flex gap-6 font-medium text-white/80">
          <button onClick={() => setActiveModal('how')} className="hover:text-white transition-colors">How It Works</button>
          <button onClick={() => setActiveModal('features')} className="hover:text-white transition-colors">Features</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium animate-pulse">
          LenslyStudio Photo Booth
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          Turn Your Device Into a <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 animate-gradient drop-shadow-lg">
            Fun Photo Booth
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed">
          Take fun photos, add wild props, generate classic photo strips, 
          create hilarious memes, and capture looping GIFs. 
        </p>
        
        <button 
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-purple-900 font-bold text-xl rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Camera className="relative z-10 animate-pulse" />
          <span className="relative z-10">Enter the Booth</span>
          <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full max-w-5xl">
          {[
            { icon: Layout, title: "Photo Strips", desc: "Classic 4-pic style" },
            { icon: Smile, title: "Props & Stickers", desc: "Drag & drop fun" },
            { icon: Video, title: "GIF Mode", desc: "Boomerang loops" },
            { icon: Zap, title: "Meme Generator", desc: "Add epic captions" }
          ].map((feat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center cursor-default">
              <div className="p-3 bg-white/10 rounded-full mb-4 text-pink-300">
                <feat.icon size={28} />
              </div>
              <h3 className="font-bold text-lg mb-1">{feat.title}</h3>
              <p className="text-sm text-white/60">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Info Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 p-8 rounded-3xl max-w-md w-full relative shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
            
            {activeModal === 'how' ? (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Settings className="text-pink-400"/> How It Works</h2>
                <div className="space-y-4 text-white/80">
                  <p className="flex items-start gap-3"><span className="bg-pink-500/20 text-pink-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">1</span> Allow camera access when prompted by your browser.</p>
                  <p className="flex items-start gap-3"><span className="bg-pink-500/20 text-pink-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">2</span> Choose your layout mode (Strips, Grid, GIF, etc) and pick a cool filter.</p>
                  <p className="flex items-start gap-3"><span className="bg-pink-500/20 text-pink-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">3</span> Strike a pose! The countdown will start automatically.</p>
                  <p className="flex items-start gap-3"><span className="bg-pink-500/20 text-pink-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">4</span> Decorate your photo with draggable stickers and text.</p>
                  <p className="flex items-start gap-3"><span className="bg-pink-500/20 text-pink-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold">5</span> Save, download, and share the final result with friends!</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Sparkles className="text-pink-400"/> Key Features</h2>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center"><Layout className="mb-2 text-pink-400"/>Classic Layouts</div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center"><Video className="mb-2 text-purple-400"/>Boomerang GIFs</div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center"><Wand2 className="mb-2 text-yellow-400"/>Live Filters</div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center flex flex-col items-center"><Smile className="mb-2 text-green-400"/>Emoji Props</div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-2 flex items-center justify-center gap-3 font-medium"><Zap className="text-blue-400"/> Full Meme Generator & Editor</div>
                </div>
              </>
            )}
            
            <button onClick={() => setActiveModal(null)} className="mt-8 w-full py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-xl font-bold transition-colors">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}