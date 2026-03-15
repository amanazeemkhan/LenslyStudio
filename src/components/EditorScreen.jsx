import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { RefreshCw, Check, Layout, Wand2, Smile, Type as TextIcon, Settings, Trash2 } from 'lucide-react';
import { RefreshCw, Check, Layout, Wand2, Smile, Type, Type as TextIcon, Settings, Trash2 } from 'lucide-react';
import { FILTERS, LAYOUT_CONFIG, LAYOUTS, BORDER_COLORS, STICKERS, FONTS, CANVAS_BASE_W, CANVAS_BASE_H, CANVAS_PADDING } from '../utils/constants';

// --- EDITOR SCREEN ---
export default function EditorScreen({ images, layout, setLayout, elements, setElements, onDone, onRetake, onRetakeSingle }) {
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('stickers'); // layouts, filters, stickers, text
  const [activeElementId, setActiveElementId] = useState(null);
  const [postFilter, setPostFilter] = useState(FILTERS[0]); // For editing filter post-capture
  const [layoutBg, setLayoutBg] = useState('#ffffff');
  const [watermarkText, setWatermarkText] = useState('📸 LenslyStudio');

  const currentLayoutConfig = LAYOUT_CONFIG[layout];

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elStart = useRef({ x: 0, y: 0 });

  // Generate array of images needed for the layout (repeating if necessary)
  const getDisplayImages = () => {
    const slots = layout === 'strip' || layout === 'grid' ? 4 : 1;
    return Array.from({ length: slots }).map((_, i) => images[i % images.length] || images[0]);
  };
  const displayImages = getDisplayImages();

  const addText = () => {
    setElements([...elements, { 
      id: Date.now(), type: 'text', content: 'Double Click Me', 
      x: 50, y: 50, scale: 1.5, color: '#ffffff', isMeme: false, fontFamily: '"Poppins", sans-serif'
    }]);
    setActiveTab('text');
  };

  const addSticker = (emoji) => {
    setElements([...elements, { 
      id: Date.now(), type: 'emoji', content: emoji, 
      x: 50, y: 50, scale: 3, rotation: 0 
    }]);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setActiveElementId(null);
  };

  // Pointer event handlers for drag
  const handlePointerDown = (e, el) => {
    e.stopPropagation();
    setActiveElementId(el.id);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    elStart.current = { x: el.x, y: el.y };
    // Prevent default to avoid scrolling on mobile
    if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') e.preventDefault(); 
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || !activeElementId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Convert pixel movement to percentages
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

  // Object-Cover logic for Canvas to prevent squashing and ensure 1:1 match with web preview
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

  // Generate Final Canvas
  const handleGenerate = async () => {
    if (!containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const canvasW = currentLayoutConfig.w;
    const canvasH = currentLayoutConfig.h;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // 1. Draw Background
    ctx.fillStyle = layout === 'single' ? '#000000' : layoutBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Helper to load image
    const loadImg = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

    // 2. Draw Photos with Object-Cover cropping to perfectly map preview
    const loadedImgs = await Promise.all(displayImages.map(loadImg));
    
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

    // 3. Draw Elements (Text & Emojis)
    elements.forEach(el => {
      const xPx = (el.x / 100) * canvasW;
      const yPx = (el.y / 100) * canvasH;
      
      ctx.save();
      ctx.translate(xPx, yPx);
      
      if (el.type === 'emoji') {
        const fontSize = el.scale * 40; 
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.fillText(el.content, 0, 0);
      } else if (el.type === 'text') {
        const fontSize = el.scale * 30;
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

    // 4. Draw Editable Watermark
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

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-950" onPointerDown={() => setActiveElementId(null)}>
      
      {/* Top/Left Toolbar */}
      <div 
        className="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col z-20 shrink-0 shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()} 
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur z-10">
          <button onClick={onRetake} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <RefreshCw size={18} /> <span className="text-sm font-medium">Retake All</span>
          </button>
          <button 
            onClick={handleGenerate}
            className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-white rounded-full font-bold shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2"
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
        <div className="p-4 flex-grow overflow-y-auto">
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
                  placeholder="e.g. Sarah's 21st 🎉"
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
              <p className="text-xs text-white/40 text-center mt-2">Click elements on the canvas to edit them</p>
            </div>
          )}
        </div>

        {/* Global Active Element Editor Panel */}
        {activeEl && (
          <div className="p-4 bg-slate-800 border-t border-white/10 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Settings size={14} /> Edit {activeEl.type === 'emoji' ? 'Sticker' : 'Text'}
              </span>
              <button 
                onClick={() => removeElement(activeEl.id)} 
                className="text-red-400 hover:text-white p-1.5 bg-red-400/10 hover:bg-red-500/80 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
            
            {/* Unified Scale Control */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-white/50 font-medium">Size</span>
                <input 
                  type="range" min="0.5" max="5" step="0.1" 
                  value={activeEl.scale || 1}
                  onChange={(e) => updateElement(activeEl.id, { scale: parseFloat(e.target.value) })}
                  className="flex-grow accent-pink-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* Text Specific Controls */}
            {activeEl.type === 'text' && (
              <div className="space-y-3">
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

                <div className="flex gap-2 items-center">
                  <select 
                    value={activeEl.fontFamily || '"Poppins", sans-serif'}
                    onChange={(e) => updateElement(activeEl.id, { fontFamily: e.target.value, isMeme: e.target.value.includes('Impact') })}
                    className="flex-grow bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-pink-500 cursor-pointer"
                    style={{ fontFamily: activeEl.fontFamily || '"Poppins", sans-serif' }}
                  >
                    {FONTS.map(f => <option key={f.name} value={f.value} className="bg-slate-800" style={{ fontFamily: f.value }}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Preview Area */}
      <div className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-black/50 p-4 md:p-8 flex items-center justify-center overflow-auto relative">
        
        {/* PIXEL-PERFECT PREVIEW CONTAINER */}
        <div 
          ref={containerRef}
          className={`relative shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all select-none overflow-hidden`}
          style={{
            backgroundColor: layout === 'single' ? '#000000' : layoutBg,
          }}
        >
          {/* Spacer to enforce 1:1 pixel-perfect aspect ratio cleanly within bounds */}
          <svg 
            width={currentLayoutConfig.w} 
            height={currentLayoutConfig.h} 
            viewBox={`0 0 ${currentLayoutConfig.w} ${currentLayoutConfig.h}`} 
            className="pointer-events-none opacity-0"
            style={{ maxWidth: '100%', maxHeight: '75vh', width: 'auto', height: 'auto', display: 'block' }}
          />

          {/* Absolute Coordinate Mapping for Photos */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {displayImages.map((src, i) => (
              <div key={i} className="bg-gray-200 overflow-hidden rounded-sm pointer-events-auto relative group" style={currentLayoutConfig.getPhotoStyle(i)}>
                <img src={src} className="w-full h-full object-cover" style={{ filter: postFilter.css }} alt={`captured-${i}`} draggable="false" />
                
                {/* Individual Retake Overlay */}
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

          {/* Draggable Overlays */}
          {elements.map(el => {
            const isActive = activeElementId === el.id;
            const elFontFamily = el.fontFamily || '"Poppins", sans-serif';
            const isMeme = el.isMeme || elFontFamily.includes('Impact');
            const isPacifico = elFontFamily.includes('Pacifico');
            
            return (
              <div 
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el)}
                className={`absolute top-0 left-0 cursor-move transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center ${isActive ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-black/50 bg-black/10 rounded-lg p-1' : ''}`}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  touchAction: 'none'
                }}
              >
                {/* Element Content */}
                <div 
                  style={{
                    transform: `scale(${el.scale}) rotate(${el.rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    color: el.color || '#fff',
                    textShadow: el.type === 'text' && !isMeme ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                    WebkitTextStroke: el.type === 'text' && isMeme ? '2px black' : '0px transparent',
                    fontFamily: elFontFamily,
                    fontWeight: el.type === 'text' ? (isMeme ? '900' : (isPacifico ? 'normal' : 'bold')) : 'normal', 
                    textTransform: el.type === 'text' && isMeme ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                  className={`${el.type === 'emoji' ? 'text-4xl' : 'text-xl'}`}
                >
                  {el.content}
                </div>
              </div>
            );
          })}

          {/* Live Preview Watermark Overlay */}
          {watermarkText && (
            <div className={`absolute pointer-events-none select-none z-40 text-white/80 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${layout === 'single' ? 'bottom-2 right-2 text-[10px]' : 'bottom-[4.5%] right-[4.5%] text-xs sm:text-sm'}`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {watermarkText}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}