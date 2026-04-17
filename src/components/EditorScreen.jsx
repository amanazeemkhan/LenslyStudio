import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check, Layout, Wand2, Smile, Type, Type as TextIcon, Settings, Trash2, Menu, X, Edit2 } from 'lucide-react';
import { FILTERS, LAYOUT_CONFIG, LAYOUTS, BORDER_COLORS, STICKERS, FONTS, CANVAS_BASE_W, CANVAS_BASE_H, CANVAS_PADDING } from '../utils/constants';

// --- EDITOR SCREEN ---
export default function EditorScreen({ images, layout, setLayout, elements, setElements, activeFilter, onDone, onRetake, onRetakeSingle }) {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('stickers'); 
  const [activeElementId, setActiveElementId] = useState(null);
  
  // THE FIX: Initialize with the activeFilter from the Booth (fallback to Normal)
  const [postFilter, setPostFilter] = useState(activeFilter || FILTERS[0]); 
  
  const [layoutBg, setLayoutBg] = useState('#ffffff');
  const [watermarkText, setWatermarkText] = useState('📸 LenslyStudio');
  
  // Mobile UX State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false); 

  const currentLayoutConfig = LAYOUT_CONFIG[layout];

  // Dragging & Tap state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elStart = useRef({ x: 0, y: 0 });
  const lastTap = useRef({ time: 0, id: null });

  // THE FIX: Safely extract the URL whether it's an object {url} or a raw string
  const getDisplayImages = () => {
    const slots = layout === 'strip' || layout === 'grid' ? 4 : 1;
    return Array.from({ length: slots }).map((_, i) => {
      const img = images[i % images.length] || images[0];
      return img?.url ? img.url : img;
    });
  };
  const displayImages = getDisplayImages();

  const addText = () => {
    const newId = Date.now();
    setElements([...elements, { 
      id: newId, type: 'text', content: 'Double Tap Me', 
      x: 50, y: 50, scale: 1, color: '#ffffff', isMeme: false, fontFamily: '"Poppins", sans-serif'
    }]);
    setActiveTab('text');
    setIsMobileMenuOpen(false); 
    setActiveElementId(newId);
    if (window.innerWidth < 768) setShowQuickEdit(true);
  };

  const addSticker = (emoji) => {
    const newId = Date.now();
    setElements([...elements, { 
      id: newId, type: 'emoji', content: emoji, 
      x: 50, y: 50, scale: 1.5, rotation: 0 
    }]);
    setIsMobileMenuOpen(false); 
    setActiveElementId(newId);
    if (window.innerWidth < 768) setShowQuickEdit(true);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setActiveElementId(null);
    setShowQuickEdit(false);
  };

  const handlePointerDown = (e, el) => {
    e.stopPropagation();

    // Custom Double-Tap Logic
    const now = Date.now();
    if (lastTap.current.id === el.id && (now - lastTap.current.time < 300)) {
      setShowQuickEdit(true); 
      isDragging.current = false; 
      return;
    }
    lastTap.current = { time: now, id: el.id };

    setActiveElementId(el.id);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    elStart.current = { x: el.x, y: el.y };
    
    if(!e.target.closest('button') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault(); 
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || !activeElementId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    const dxPercent = (dx / containerRect.width) * 100;
    const dyPercent = (dy / containerRect.height) * 100;
    
    updateElement(activeElementId, {
      x: Math.max(0, Math.min(100, elStart.current.x + dxPercent)),
      y: Math.max(0, Math.min(100, elStart.current.y + dyPercent))
    });
  }, [activeElementId, elements]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const drawImageCover = (ctx, img, x, y, w, h) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let renderW, renderH, renderX, renderY;

    if (imgRatio < canvasRatio) {
      renderW = w;
      renderH = w / imgRatio;
      renderX = x;
      renderY = y + (h - renderH) / 2;
    } else {
      renderW = h * imgRatio;
      renderH = h;
      renderX = x + (w - renderW) / 2;
      renderY = y;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, renderX, renderY, renderW, renderH);
    ctx.restore();
  };

  const handleGenerate = async () => {
    if (!containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const canvasW = currentLayoutConfig.w;
    const canvasH = currentLayoutConfig.h;

    canvas.width = canvasW;
    canvas.height = canvasH;

    const domRect = containerRef.current.getBoundingClientRect();
    const scaleFactor = canvasW / domRect.width; 

    ctx.fillStyle = layout === 'single' ? '#000000' : layoutBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

    const loadedImgs = await Promise.all(displayImages.map(loadImg));
    
    // THIS WORKS ON ALL BROWSERS (Even iOS!) because the source is a static Image
    ctx.filter = postFilter.canvas;

    if (layout === 'strip') {
      loadedImgs.forEach((img, i) => {
        const y = CANVAS_PADDING + (i * (CANVAS_BASE_H + CANVAS_PADDING));
        drawImageCover(ctx, img, CANVAS_PADDING, y, CANVAS_BASE_W, CANVAS_BASE_H);
      });
    } else if (layout === 'grid') {
      loadedImgs.forEach((img, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = CANVAS_PADDING + (col * (CANVAS_BASE_W + CANVAS_PADDING));
        const y = CANVAS_PADDING + (row * (CANVAS_BASE_H + CANVAS_PADDING));
        drawImageCover(ctx, img, x, y, CANVAS_BASE_W, CANVAS_BASE_H);
      });
    } else if (layout === 'polaroid') {
      if (loadedImgs[0]) drawImageCover(ctx, loadedImgs[0], CANVAS_PADDING, CANVAS_PADDING, CANVAS_BASE_W, CANVAS_BASE_H);
    } else {
      if (loadedImgs[0]) drawImageCover(ctx, loadedImgs[0], 0, 0, CANVAS_BASE_W, CANVAS_BASE_H);
    }

    ctx.filter = 'none';

    elements.forEach(el => {
      const xPx = (el.x / 100) * canvasW;
      const yPx = (el.y / 100) * canvasH;
      
      ctx.save();
      ctx.translate(xPx, yPx);
      
      if (el.type === 'emoji') {
        const fontSize = el.scale * 40 * scaleFactor; 
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.fillText(el.content, 0, 0);
      } else if (el.type === 'text') {
        const fontSize = el.scale * 30 * scaleFactor;
        const fontFamily = el.fontFamily || '"Poppins", sans-serif';
        const isMeme = el.isMeme || fontFamily.includes('Impact');
        const isPacifico = fontFamily.includes('Pacifico');
        const fontWeight = isMeme ? '900' : (isPacifico ? 'normal' : 'bold');
        
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isMeme) {
          ctx.lineWidth = fontSize * 0.15; 
          ctx.strokeStyle = '#000000';
          ctx.lineJoin = 'round';
          ctx.strokeText(el.content.toUpperCase(), 0, 0);
          ctx.fillStyle = el.color || '#ffffff'; 
          ctx.fillText(el.content.toUpperCase(), 0, 0);
        } else {
          ctx.fillStyle = el.color || '#ffffff';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(el.content, 0, 0);
        }
      }
      ctx.restore();
    });

    if (watermarkText) {
      ctx.save();
      ctx.font = 'bold 28px "Poppins", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      const watermarkX = canvasW - (layout === 'single' ? 20 : CANVAS_PADDING);
      const watermarkY = canvasH - (layout === 'single' ? 20 : CANVAS_PADDING);
      ctx.fillText(watermarkText, watermarkX, watermarkY);
      ctx.restore();
    }

    onDone(canvas.toDataURL('image/jpeg', 0.95));
  };

  const activeEl = activeElementId ? elements.find(e => e.id === activeElementId) : null;
  const textElements = elements.filter(e => e.type === 'text');

  return (
    <div 
      className="h-screen w-full flex bg-slate-950 overflow-hidden relative" 
      onPointerDown={() => {
        setActiveElementId(null);
        setShowQuickEdit(false);
      }}
    >
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden transition-opacity"
          onPointerDown={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Slide-out Sidebar (Mobile) / Permanent Sidebar (Desktop) */}
      <div 
        className={`fixed inset-y-0 left-0 w-[85vw] sm:w-80 bg-slate-900 border-r border-white/10 flex flex-col z-50 shrink-0 shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onPointerDown={(e) => e.stopPropagation()} 
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 -ml-2 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <button onClick={onRetake} className="hidden md:flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <RefreshCw size={18} /> <span className="text-sm font-medium">Retake</span>
            </button>
          </div>
          <button 
            onClick={handleGenerate}
            className="hidden md:flex px-5 py-2 bg-pink-500 hover:bg-pink-400 text-white rounded-full font-bold shadow-lg shadow-pink-500/30 transition-all active:scale-95 items-center gap-2"
          >
            Finish <Check size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 shrink-0">
          {[
            { id: 'layouts', icon: Layout, label: 'Layout' },
            { id: 'filters', icon: Wand2, label: 'Filters' },
            { id: 'stickers', icon: Smile, label: 'Stickers' },
            { id: 'text', icon: Type, label: 'Text' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'bg-white/10 text-pink-400 border-b-2 border-pink-500' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              <tab.icon size={18} />
              <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-grow overflow-y-auto pb-24 md:pb-4">
          {activeTab === 'layouts' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase mb-3">Layout Style</h4>
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUTS.map(l => (
                    <button 
                      key={l.id} 
                      onClick={() => setLayout(l.id)}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${layout === l.id ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-white/20 text-white/70 hover:bg-white/5'}`}
                    >
                      <Layout size={24} />
                      <span className="text-sm font-medium text-center">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {layout !== 'single' && (
                <div>
                  <h4 className="text-xs font-bold text-white/50 uppercase mb-3">Border Color</h4>
                  <div className="flex flex-wrap gap-3">
                    {BORDER_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setLayoutBg(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${layoutBg === c ? 'border-pink-500 scale-110' : 'border-white/20 hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase mb-3">Event Watermark</h4>
                <input 
                  type="text" 
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. Aman's 21st 🎉"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="grid grid-cols-2 gap-3">
              {FILTERS.map(f => (
                <button 
                  key={f.name} 
                  onClick={() => setPostFilter(f)}
                  className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${postFilter.name === f.name ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-white/20 text-white/70 hover:bg-white/5'}`}
                >
                  <Wand2 size={24} />
                  <span className="text-sm font-medium text-center">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'stickers' && (
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((emoji, i) => (
                <button 
                  key={i} 
                  onClick={() => addSticker(emoji)}
                  className="text-4xl hover:scale-125 transition-transform p-2 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={addText}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <TextIcon size={18} /> Add New Text
              </button>
              
              {/* Sidebar Text List for easy selection */}
              {textElements.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Current Text</h4>
                  {textElements.map(el => (
                    <button
                      key={el.id}
                      onClick={() => {
                        setActiveElementId(el.id);
                        if (window.innerWidth < 768) {
                          setIsMobileMenuOpen(false);
                          setShowQuickEdit(true);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between ${activeElementId === el.id ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}
                    >
                      <span className="truncate pr-2 text-sm" style={{ fontFamily: el.fontFamily }}>{el.content}</span>
                      <Settings size={14} className="shrink-0 opacity-50" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40 text-center mt-2">Double-tap elements or use the corner buttons to edit</p>
              )}
            </div>
          )}
        </div>

        {/* Desktop-Only Element Editor Panel (Hidden on Mobile) */}
        {activeEl && (
          <div className="hidden md:block p-4 bg-slate-800 border-t border-white/10 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Settings size={14} /> Edit {activeEl.type === 'emoji' ? 'Sticker' : 'Text'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-white/50 font-medium">Size</span>
                <input 
                  type="range" min="0.1" max="8" step="0.1" 
                  value={activeEl.scale || 1}
                  onChange={(e) => updateElement(activeEl.id, { scale: parseFloat(e.target.value) })}
                  className="flex-grow accent-pink-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {activeEl.type === 'text' && (
              <div className="space-y-3 w-full overflow-hidden">
                <input 
                  type="text" 
                  value={activeEl.content}
                  onChange={(e) => updateElement(activeEl.id, { content: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-pink-500 text-sm"
                  placeholder="Type your text..."
                />
                
                <div className="flex flex-wrap gap-2">
                  {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
                    <button 
                      key={c}
                      onClick={() => updateElement(activeEl.id, { color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${activeEl.color === c ? 'border-pink-500 scale-110' : 'border-white/20'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="w-full flex overflow-x-auto gap-2 pb-1 pt-1 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {FONTS.map(f => (
                    <button
                      key={f.name}
                      onClick={() => updateElement(activeEl.id, { fontFamily: f.value, isMeme: f.value.includes('Impact') })}
                      className={`shrink-0 px-3 py-1.5 rounded-lg border text-sm transition-colors ${activeEl.fontFamily === f.value ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-white/10 bg-slate-900 text-white hover:bg-slate-700'}`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Preview Area */}
      <div className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-black/50 p-4 md:p-8 flex flex-col items-center justify-center overflow-auto relative">
        
        <div className="md:hidden absolute top-4 inset-x-4 flex justify-between items-start z-30 pointer-events-none">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 bg-slate-900/80 backdrop-blur border border-white/20 rounded-full text-white shadow-lg pointer-events-auto transition-transform active:scale-95"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col gap-2 items-end pointer-events-auto">
            <button 
              onClick={handleGenerate}
              className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-bold shadow-lg shadow-pink-500/30 flex items-center gap-2 transition-transform active:scale-95"
            >
              Finish <Check size={16} />
            </button>
            <button 
              onClick={onRetake}
              className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-white/20 text-white rounded-full text-sm font-medium shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Retake
            </button>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className={`relative shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all select-none overflow-hidden mt-16 md:mt-0`}
          style={{
            backgroundColor: layout === 'single' ? '#000000' : layoutBg,
          }}
        >
          <svg 
            width={currentLayoutConfig.w} 
            height={currentLayoutConfig.h} 
            viewBox={`0 0 ${currentLayoutConfig.w} ${currentLayoutConfig.h}`} 
            className="pointer-events-none opacity-0"
            style={{ maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto', display: 'block' }}
          />

          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {displayImages.map((src, i) => (
              <div key={i} className="bg-gray-200 overflow-hidden rounded-sm pointer-events-auto relative group" style={currentLayoutConfig.getPhotoStyle(i)}>
                <img src={src} className="w-full h-full object-cover" style={{ filter: postFilter.css }} alt={`captured-${i}`} draggable="false" />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px] cursor-pointer">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRetakeSingle(i, displayImages); }}
                    className="bg-pink-500 hover:bg-pink-400 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 text-xs sm:text-sm shadow-lg transition-transform active:scale-95 pointer-events-auto"
                  >
                    <RefreshCw size={16} /> Retake
                  </button>
                </div>
              </div>
            ))}
          </div>

          {elements.map(el => {
            const isActive = activeElementId === el.id;
            const elFontFamily = el.fontFamily || '"Poppins", sans-serif';
            const isMeme = el.isMeme || elFontFamily.includes('Impact');
            const isPacifico = elFontFamily.includes('Pacifico');
            
            return (
              <div 
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el)}
                className={`absolute top-0 left-0 cursor-move transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${isActive ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-black/50 bg-black/10 rounded-xl' : ''}`}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  touchAction: 'none',
                  zIndex: isActive ? 45 : 30
                }}
              >
                {isActive && (
                  <>
                    <button 
                      onPointerDown={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="absolute -top-4 -left-4 bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-400 pointer-events-auto z-50 touch-none"
                    >
                      <X size={14} />
                    </button>
                    <button 
                      onPointerDown={(e) => { e.stopPropagation(); setShowQuickEdit(true); }}
                      className="md:hidden absolute -top-4 -right-4 bg-slate-800 border border-white/20 text-white rounded-full p-2 shadow-xl hover:bg-slate-700 pointer-events-auto z-50 touch-none"
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}

                <div 
                  style={{
                    transform: `rotate(${el.rotation || 0}deg)`,
                    fontSize: el.type === 'emoji' ? `${el.scale * 40}px` : `${el.scale * 30}px`,
                    lineHeight: 1.1,
                    padding: '12px',
                    color: el.color || '#fff',
                    textShadow: el.type === 'text' && !isMeme ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                    WebkitTextStroke: el.type === 'text' && isMeme ? '2px black' : '0px transparent',
                    fontFamily: elFontFamily,
                    fontWeight: el.type === 'text' ? (isMeme ? '900' : (isPacifico ? 'normal' : 'bold')) : 'normal', 
                    textTransform: el.type === 'text' && isMeme ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {el.content}
                </div>
              </div>
            );
          })}

          {watermarkText && (
            <div className={`absolute pointer-events-none select-none z-40 text-white/80 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${layout === 'single' ? 'bottom-2 right-2 text-[10px]' : 'bottom-[4.5%] right-[4.5%] text-xs sm:text-sm'}`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {watermarkText}
            </div>
          )}

        </div>
      </div>

      {activeEl && showQuickEdit && (
        <div 
          className="md:hidden fixed inset-x-0 bottom-0 z-[60] bg-slate-900/95 backdrop-blur-xl border-t border-white/20 rounded-t-3xl p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} /> Edit {activeEl.type === 'emoji' ? 'Sticker' : 'Text'}
            </span>
            <button 
              onClick={() => setShowQuickEdit(false)} 
              className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-full text-sm transition-transform active:scale-95"
            >
              Done
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-white/50 font-medium">Size</span>
              <input 
                type="range" min="0.1" max="8" step="0.1" 
                value={activeEl.scale || 1}
                onChange={(e) => updateElement(activeEl.id, { scale: parseFloat(e.target.value) })}
                className="flex-grow accent-pink-500 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
          </div>

          {activeEl.type === 'text' && (
            <div className="space-y-4 w-full overflow-hidden">
              <input 
                type="text" 
                value={activeEl.content}
                onChange={(e) => updateElement(activeEl.id, { content: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 text-sm"
                placeholder="Type your text..."
              />
              
              <div className="flex flex-col gap-3 w-full mt-2">
                <div className="flex flex-wrap gap-2 w-full">
                  {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map(c => (
                    <button 
                      key={c}
                      onClick={() => updateElement(activeEl.id, { color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${activeEl.color === c ? 'border-pink-500 scale-110' : 'border-white/20'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="w-full flex overflow-x-auto gap-2 pb-2 pt-1 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {FONTS.map(f => (
                    <button
                      key={f.name}
                      onClick={() => updateElement(activeEl.id, { fontFamily: f.value, isMeme: f.value.includes('Impact') })}
                      className={`shrink-0 px-4 py-2 rounded-xl border text-sm transition-colors ${activeEl.fontFamily === f.value ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-white/10 bg-slate-800 text-white hover:bg-slate-700'}`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}