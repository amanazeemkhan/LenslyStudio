// --- CONSTANTS & CONFIG ---
export const POSES = [
  "Look shocked! 😲",
  "Pretend you're a villain 🦹",
  "Show your best model pose 📸",
  "Fake laugh 😂",
  "Give a peace sign ✌️",
  "Look mysterious 🕵️",
  "Act like you just woke up 🥱",
  "Stare intensely into the lens 👁️"
];

export const FILTERS = [
  { name: 'Normal', css: 'none', canvas: 'none' },
  { name: 'B & W', css: 'grayscale(100%)', canvas: 'grayscale(100%)' },
  { name: 'Vibrant', css: 'saturate(200%) contrast(110%)', canvas: 'saturate(200%) contrast(110%)' },
  { name: 'Golden', css: 'sepia(40%) saturate(150%) contrast(110%) hue-rotate(-15deg)', canvas: 'sepia(40%) saturate(150%) contrast(110%) hue-rotate(-15deg)' },
  { name: 'Faded', css: 'contrast(80%) brightness(120%) saturate(80%)', canvas: 'contrast(80%) brightness(120%) saturate(80%)' },
  { name: 'Cyber', css: 'saturate(150%) contrast(120%) hue-rotate(180deg)', canvas: 'saturate(150%) contrast(120%) hue-rotate(180deg)' },
  { name: 'Noir', css: 'grayscale(100%) contrast(150%) brightness(90%)', canvas: 'grayscale(100%) contrast(150%) brightness(90%)' },
  { name: 'Vintage', css: 'sepia(80%) contrast(120%)', canvas: 'sepia(80%) contrast(120%)' },
  { name: 'Neon', css: 'hue-rotate(90deg) saturate(200%)', canvas: 'hue-rotate(90deg) saturate(200%)' },
  { name: 'Warm', css: 'sepia(30%) saturate(140%) hue-rotate(-10deg)', canvas: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' },
  { name: 'Cool', css: 'saturate(120%) hue-rotate(180deg)', canvas: 'saturate(120%) hue-rotate(180deg)' }
];

export const STICKERS = [
  '😎', '🥸', '😍', '😂', '🥺', '😡', '😱', '🥳', 
  '👑', '🎩', '🧢', '🎓', '🎀', '🕶️', '👓', '🪄',
  '🔥', '❤️', '💔', '✨', '🌈', '🌟', '💥', '💦',
  '🍕', '🍔', '🍩', '🍹', '🎉', '🎈', '🎁', '🎂',
  '👽', '👻', '🤖', '👾', '💎', '💯', '✌️', '👍', 
  '🫶', '🐶', '🐱', '🦄', '🐸', '🦋', '🌻', '🌸'
];

export const LAYOUTS = [
  { id: 'strip', name: 'Photo Strip', photos: 4 },
  { id: 'grid', name: '2x2 Grid', photos: 4 },
  { id: 'polaroid', name: 'Polaroid', photos: 1 },
  { id: 'single', name: 'Single Photo', photos: 1 }
];

export const FONTS = [
  { name: 'Modern (Poppins)', value: '"Poppins", sans-serif' },
  { name: 'Brush (Pacifico)', value: '"Pacifico", cursive' },
  { name: 'Marker (Caveat)', value: '"Caveat", cursive' },
  { name: 'Bold (Oswald)', value: '"Oswald", sans-serif' },
  { name: 'Meme (Impact)', value: 'Impact, sans-serif' }
];

export const BORDER_COLORS = ['#ffffff', '#000000', '#fbcfe8', '#c4b5fd', '#93c5fd', '#fde68a'];

// --- MATH CONSTANTS FOR 1:1 PIXEL PERFECT WYSIWYG ---
export const CANVAS_BASE_W = 800;
export const CANVAS_BASE_H = 600;
export const CANVAS_PADDING = 40;

export const LAYOUT_CONFIG = {
  strip: { 
    w: CANVAS_BASE_W + (CANVAS_PADDING * 2), 
    h: (CANVAS_BASE_H * 4) + (CANVAS_PADDING * 5), 
    getPhotoStyle: (i) => ({ 
      left: `${(CANVAS_PADDING / (CANVAS_BASE_W + CANVAS_PADDING * 2)) * 100}%`, 
      top: `${((CANVAS_PADDING + i * (CANVAS_BASE_H + CANVAS_PADDING)) / ((CANVAS_BASE_H * 4) + (CANVAS_PADDING * 5))) * 100}%`, 
      width: `${(CANVAS_BASE_W / (CANVAS_BASE_W + CANVAS_PADDING * 2)) * 100}%`, 
      height: `${(CANVAS_BASE_H / ((CANVAS_BASE_H * 4) + (CANVAS_PADDING * 5))) * 100}%`, 
      position: 'absolute' 
    }) 
  },
  grid: { 
    w: (CANVAS_BASE_W * 2) + (CANVAS_PADDING * 3), 
    h: (CANVAS_BASE_H * 2) + (CANVAS_PADDING * 3), 
    getPhotoStyle: (i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return { 
        left: `${((CANVAS_PADDING + col * (CANVAS_BASE_W + CANVAS_PADDING)) / ((CANVAS_BASE_W * 2) + (CANVAS_PADDING * 3))) * 100}%`, 
        top: `${((CANVAS_PADDING + row * (CANVAS_BASE_H + CANVAS_PADDING)) / ((CANVAS_BASE_H * 2) + (CANVAS_PADDING * 3))) * 100}%`, 
        width: `${(CANVAS_BASE_W / ((CANVAS_BASE_W * 2) + (CANVAS_PADDING * 3))) * 100}%`, 
        height: `${(CANVAS_BASE_H / ((CANVAS_BASE_H * 2) + (CANVAS_PADDING * 3))) * 100}%`, 
        position: 'absolute' 
      };
    } 
  },
  polaroid: { 
    w: CANVAS_BASE_W + CANVAS_PADDING * 2, 
    h: CANVAS_BASE_H + CANVAS_PADDING + 200, 
    getPhotoStyle: (i) => ({ 
      left: `${(CANVAS_PADDING / (CANVAS_BASE_W + CANVAS_PADDING * 2)) * 100}%`, 
      top: `${(CANVAS_PADDING / (CANVAS_BASE_H + CANVAS_PADDING + 200)) * 100}%`, 
      width: `${(CANVAS_BASE_W / (CANVAS_BASE_W + CANVAS_PADDING * 2)) * 100}%`, 
      height: `${(CANVAS_BASE_H / (CANVAS_BASE_H + CANVAS_PADDING + 200)) * 100}%`, 
      position: 'absolute' 
    }) 
  },
  single: { 
    w: CANVAS_BASE_W, 
    h: CANVAS_BASE_H, 
    getPhotoStyle: (i) => ({ left: '0%', top: '0%', width: '100%', height: '100%', position: 'absolute' }) 
  }
};