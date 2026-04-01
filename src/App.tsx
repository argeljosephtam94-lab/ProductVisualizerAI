import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Coffee, 
  Monitor, 
  Shirt, 
  Layout, 
  Loader2, 
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Zap,
  Star,
  Smartphone,
  ShoppingBag,
  Bus,
  Palette,
  Search,
  Maximize2
} from 'lucide-react';
import { visualizeProduct, refineVisualization } from './services/geminiService';
import { cn } from './lib/utils';

const MEDIUMS = [
  { id: 'coffee-mug', name: 'Coffee Mug', icon: Coffee, description: 'A ceramic mug on a wooden desk' },
  { id: 'billboard', name: 'Billboard', icon: Layout, description: 'A large outdoor billboard in a city' },
  { id: 't-shirt', name: 'T-Shirt', icon: Shirt, description: 'A high-quality cotton t-shirt on a model' },
  { id: 'laptop-skin', name: 'Laptop Skin', icon: Monitor, description: 'A sleek laptop with a custom skin' },
  { id: 'poster', name: 'Poster', icon: ImageIcon, description: 'A framed poster on a minimalist wall' },
  { id: 'tote-bag', name: 'Tote Bag', icon: ShoppingBag, description: 'A canvas tote bag held by a person' },
  { id: 'phone-case', name: 'Phone Case', icon: Smartphone, description: 'A premium phone case on a marble surface' },
  { id: 'bus-stop', name: 'Bus Stop', icon: Bus, description: 'A digital display at a modern bus stop' },
  { id: 'wall-art', name: 'Wall Art', icon: Palette, description: 'A large canvas print in a luxury living room' },
  { id: 'magazine', name: 'Magazine Ad', icon: Layout, description: 'A full-page glossy magazine advertisement' },
  { id: 'social-media', name: 'Social Media Post', icon: Smartphone, description: 'A square Instagram-style post on a phone' },
  { id: 'storefront', name: 'Storefront Window', icon: Layout, description: 'A product display in a high-end boutique window' },
  { id: 'bus-wrap', name: 'Bus Wrap', icon: Bus, description: 'A full-size bus wrapped in a product advertisement' },
  { id: 'packaging', name: 'Product Packaging', icon: ShoppingBag, description: 'A premium box packaging on a clean studio background' },
  { id: 'kiosk', name: 'Mall Kiosk', icon: Monitor, description: 'A digital kiosk display in a busy shopping mall' },
];

const RESOLUTIONS = [
  { id: '512px', name: '512px', label: 'Standard' },
  { id: '1K', name: '1K', label: 'HD' },
  { id: '2K', name: '2K', label: '2K' },
  { id: '4K', name: '4K', label: '4K' },
] as const;

const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', label: '1:1' },
  { id: '3:4', name: 'Portrait', label: '3:4' },
  { id: '9:16', name: 'Tall', label: '9:16' },
  { id: '4:3', name: 'Landscape', label: '4:3' },
  { id: '16:9', name: 'Wide', label: '16:9' },
] as const;

export default function App() {
  const [originalImage, setOriginalImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [selectedMedium, setSelectedMedium] = useState(MEDIUMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showMediums, setShowMediums] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [mediumSearch, setMediumSearch] = useState("");
  const [selectedResolution, setSelectedResolution] = useState<typeof RESOLUTIONS[number]['id']>('1K');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<typeof ASPECT_RATIOS[number]['id']>('1:1');

  const filteredMediums = MEDIUMS.filter(m => 
    m.name.toLowerCase().includes(mediumSearch.toLowerCase()) ||
    m.description.toLowerCase().includes(mediumSearch.toLowerCase())
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setOriginalImage({ base64, mimeType: file.type });
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleGenerate = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await visualizeProduct(
        originalImage.base64,
        originalImage.mimeType,
        selectedMedium.description,
        selectedResolution,
        selectedAspectRatio
      );
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate visualization. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `visualized-${selectedMedium.id}.png`;
    link.click();
  };

  const handleRefine = async () => {
    if (!generatedImage || !refinementPrompt) return;

    setIsGenerating(true);
    setError(null);
    try {
      // We send the current generated image to be refined
      const base64 = generatedImage.split(',')[1];
      const result = await refineVisualization(
        base64,
        'image/png',
        refinementPrompt,
        selectedResolution,
        selectedAspectRatio
      );
      setGeneratedImage(result);
      setRefinementPrompt("");
    } catch (err) {
      console.error(err);
      setError("Failed to adjust design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-none flex items-center justify-center ai-glow">
              <Layout className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProductVisualizer<span className="text-cyan-400">AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-wider text-zinc-500">
            <button 
              onClick={() => setShowHowItWorks(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button 
              onClick={() => setShowMediums(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Mediums
            </button>
            <button 
              onClick={() => setShowPricing(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
          <button className="bg-zinc-100 text-black px-4 py-2 rounded-none text-sm font-bold hover:bg-cyan-400 transition-all ai-glow hover:ai-glow-strong">
            Get Started
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Controls */}
          <div className="space-y-10">
            <section>
              <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-4 uppercase">
                Visualize your <br />
                <span className="text-cyan-400 ai-glow">product</span> anywhere.
              </h1>
              <p className="text-zinc-500 text-lg max-w-md font-medium">
                Upload a product image and see it instantly rendered on various marketing mediums using advanced AI.
              </p>
            </section>

            {/* Upload Area */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 font-mono">01. Upload Product Image</h2>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border border-dashed p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center group glass-panel",
                  isDragActive ? "border-cyan-500 bg-cyan-500/5" : "border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900/50",
                  originalImage ? "border-cyan-500/50 bg-cyan-500/5" : ""
                )}
              >
                <input {...getInputProps()} />
                {originalImage ? (
                  <div className="relative w-full aspect-video overflow-hidden shadow-2xl border border-zinc-700">
                    <img 
                      src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} 
                      alt="Original" 
                      className="w-full h-full object-contain bg-zinc-950"
                    />
                    <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <p className="text-white font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                        <RefreshCw className="w-4 h-4" /> Change Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-cyan-500/20 group-hover:ai-glow">
                      <Upload className="text-zinc-500 w-8 h-8 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg uppercase tracking-tight">Drop your product image here</p>
                      <p className="text-zinc-600 text-xs font-mono">PNG, JPG or WEBP (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Medium Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 font-mono">02. Select Marketing Medium</h2>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input 
                    type="text" 
                    placeholder="Search..."
                    value={mediumSearch}
                    onChange={(e) => setMediumSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-none text-[10px] uppercase font-mono tracking-wider focus:border-cyan-500 outline-none transition-all text-zinc-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMediums.slice(0, 5).map((medium) => (
                  <button
                    key={medium.id}
                    onClick={() => setSelectedMedium(medium)}
                    className={cn(
                      "p-4 border transition-all text-left flex flex-col gap-3 group glass-panel",
                      selectedMedium.id === medium.id 
                        ? "border-cyan-500 bg-cyan-500/10 ai-glow" 
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/20"
                    )}
                  >
                    <medium.icon className={cn(
                      "w-6 h-6 transition-colors",
                      selectedMedium.id === medium.id ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"
                    )} />
                    <span className="font-bold text-xs uppercase tracking-tight">{medium.name}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setShowMediums(true)}
                  className="p-4 border border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center flex flex-col items-center justify-center gap-1 group glass-panel"
                >
                  <span className="text-cyan-400 font-bold text-xs">+ {MEDIUMS.length - 5} More</span>
                  <span className="text-[8px] text-zinc-600 uppercase font-bold font-mono">View All</span>
                </button>
              </div>
            </section>

            {/* Resolution & Aspect Ratio Selection */}
            <div className="grid sm:grid-cols-2 gap-6">
              <section className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 font-mono">03. Select Resolution</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-none w-fit">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setSelectedResolution(res.id)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 font-mono",
                        selectedResolution === res.id 
                          ? "bg-cyan-500 text-black ai-glow" 
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <span>{res.name}</span>
                      <span className="text-[8px] opacity-60">{res.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 font-mono">04. Aspect Ratio</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-none w-fit">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedAspectRatio(ratio.id)}
                      className={cn(
                        "px-3 py-2 text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 min-w-[60px] font-mono",
                        selectedAspectRatio === ratio.id 
                          ? "bg-cyan-500 text-black ai-glow" 
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <span>{ratio.name}</span>
                      <span className="text-[8px] opacity-60">{ratio.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!originalImage || isGenerating}
              className={cn(
                "w-full py-5 rounded-none font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                !originalImage || isGenerating 
                  ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800" 
                  : "bg-cyan-500 text-black hover:bg-cyan-400 active:scale-[0.98] ai-glow hover:ai-glow-strong"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Generate
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-mono uppercase tracking-wider">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result Display */}
          <div className="sticky top-28">
            <div className="relative w-full bg-zinc-950 border border-zinc-800 ai-glow overflow-hidden" style={{ aspectRatio: selectedAspectRatio.replace(':', '/') }}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-cyan-500/10 animate-pulse" />
                      <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-xl uppercase tracking-tighter">Synthesizing</p>
                      <p className="text-zinc-600 text-[10px] uppercase font-mono tracking-widest">AI is rendering your product...</p>
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 group"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Generated Result" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <button 
                        onClick={handleDownload}
                        className="bg-cyan-500 text-black px-6 py-3 font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 hover:bg-cyan-400 transition-all active:scale-95"
                      >
                        <Download className="w-5 h-5" /> DOWNLOAD
                      </button>
                      <button 
                        onClick={() => setGeneratedImage(null)}
                        className="bg-zinc-900/80 backdrop-blur-md text-white border border-zinc-700 px-6 py-3 font-bold shadow-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95"
                      >
                        <RefreshCw className="w-5 h-5" /> RESET
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-900/50 text-zinc-500 p-12 text-center"
                  >
                    <div className="w-20 h-20 border border-dashed border-zinc-800 flex items-center justify-center bg-zinc-950/50">
                      <ImageIcon className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-zinc-400 tracking-tight">VISUALIZATION PREVIEW</p>
                      <p className="text-xs max-w-[200px] mx-auto mt-2 text-zinc-600 font-mono">Upload an image and click generate to see the AI magic happen.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Adjustment Box */}
            {generatedImage && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 glass-panel border border-zinc-800/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/70">Adjust Product Design</h2>
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-none font-bold border border-cyan-500/20 tracking-widest">AI POWERED</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g. Change background to blue, make it sunset..."
                    className="flex-grow px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all text-sm text-zinc-300 placeholder:text-zinc-700"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={!refinementPrompt || isGenerating}
                    className="bg-cyan-500 text-black px-6 py-3 font-bold hover:bg-cyan-400 transition-all disabled:bg-zinc-900 disabled:text-zinc-700 flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    ADJUST
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono italic">Describe how you want to change the generated image above.</p>
              </motion.div>
            )}

            {/* Stats/Info */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="glass-panel p-4 border border-zinc-800/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Resolution</p>
                <p className="font-bold text-zinc-300 font-mono">1024 x 1024</p>
              </div>
              <div className="glass-panel p-4 border border-zinc-800/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">AI Model</p>
                <p className="font-bold text-zinc-300 font-mono">Gemini 3.1</p>
              </div>
              <div className="glass-panel p-4 border border-zinc-800/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Consistency</p>
                <p className="font-bold text-cyan-400 font-mono">ULTRA</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 mt-20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
              <Layout className="text-black w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tighter text-white">PRODUCT VISUALIZER <span className="text-cyan-500">AI</span></span>
          </div>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">© 2026 PV-AI SYSTEM. POWERED BY GOOGLE GEMINI NEURAL ENGINE.</p>
          <div className="flex gap-8 text-zinc-500 text-xs font-bold tracking-widest uppercase">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-cyan-400 transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-cyan-400 transition-colors cursor-pointer">Terms</button>
            <a href="mailto:argeljosephtam94@gmail.com" className="hover:text-cyan-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* How it Works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowItWorks(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-zinc-900 rounded-none transition-colors text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-bold tracking-tighter mb-8 text-white uppercase">How to use <span className="text-cyan-500">PV-AI</span></h2>
                
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold shrink-0 font-mono">01</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 text-zinc-200 uppercase tracking-tight">Upload your product</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">Drag and drop or click to upload a high-quality image of your product. For best results, use an image with a clean background.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold shrink-0 font-mono">02</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 text-zinc-200 uppercase tracking-tight">Select a medium</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">Choose from our curated list of marketing mediums like coffee mugs, billboards, or t-shirts where you want to see your product.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-none bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold shrink-0 font-mono">03</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 text-zinc-200 uppercase tracking-tight">Generate & Download</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">Click generate and let our AI handle the rest. Once finished, you can download your professional visualization instantly.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="w-full mt-12 bg-cyan-500 text-black py-4 font-bold hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  INITIALIZE SYSTEM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mediums Modal */}
      <AnimatePresence>
        {showMediums && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMediums(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 md:p-12 overflow-y-auto">
                <button 
                  onClick={() => setShowMediums(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-zinc-900 rounded-none transition-colors text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-bold tracking-tighter mb-2 text-white uppercase">Available <span className="text-cyan-500">Mediums</span></h2>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Explore professional settings for your product visualization.</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <input 
                      type="text" 
                      placeholder="Search for a medium..."
                      value={mediumSearch}
                      onChange={(e) => setMediumSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500/50 outline-none transition-all text-zinc-300 placeholder:text-zinc-700 font-mono uppercase text-xs tracking-widest"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMediums.map((medium) => (
                    <div 
                      key={medium.id}
                      className="p-6 border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-cyan-500/30 transition-all group cursor-pointer"
                      onClick={() => {
                        setSelectedMedium(medium);
                        setShowMediums(false);
                      }}
                    >
                      <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all">
                        <medium.icon className="w-6 h-6 text-cyan-500" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-zinc-200 uppercase tracking-tight">{medium.name}</h3>
                      <p className="text-zinc-500 text-xs leading-relaxed font-mono">{medium.description}</p>
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 group-hover:text-cyan-400 flex items-center gap-1">
                        SELECT MEDIUM <Zap className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPricing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-16">
                <button 
                  onClick={() => setShowPricing(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-zinc-900 rounded-none transition-colors text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-16">
                  <span className="bg-cyan-500/10 text-cyan-400 px-4 py-1 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block border border-cyan-500/20">System Access</span>
                  <h2 className="text-5xl font-bold tracking-tighter mb-4 text-white uppercase">Simple, <span className="text-cyan-500 italic font-serif lowercase">transparent</span> pricing.</h2>
                  <p className="text-zinc-500 max-w-lg mx-auto font-mono text-xs uppercase tracking-widest">High-performance visualization for every creator.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Free Plan */}
                  <div className="bg-zinc-900/50 p-8 border border-zinc-800 flex flex-col hover:border-zinc-700 transition-colors">
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2 text-zinc-200 uppercase tracking-tight">Basic</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">₱0</span>
                        <span className="text-zinc-600 text-xs font-mono">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> 5 VISUALS / MO
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> STANDARD RES
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> BASIC MEDIUMS
                      </li>
                    </ul>
                    <button className="w-full py-4 font-bold border border-zinc-800 text-zinc-500 hover:bg-zinc-800 transition-all uppercase text-xs tracking-widest">Current Tier</button>
                  </div>

                  {/* Student Plan */}
                  <div className="bg-zinc-900 p-8 border-2 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col relative transform scale-105 z-10">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-4 py-1 rounded-none text-[9px] font-bold uppercase tracking-[0.2em]">Recommended</div>
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-white uppercase tracking-tight">Creator <Star className="w-4 h-4 text-cyan-500 fill-cyan-500" /></h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">₱49</span>
                        <span className="text-zinc-400 text-xs font-mono">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-xs text-zinc-200 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> 50 VISUALS / MO
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-200 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> HD RESOLUTION
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-200 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> ALL MEDIUMS
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-200 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> NO WATERMARKS
                      </li>
                    </ul>
                    <button className="w-full py-4 font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase text-xs tracking-widest">Upgrade System</button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-zinc-900/50 p-8 border border-zinc-800 flex flex-col hover:border-zinc-700 transition-colors">
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2 text-zinc-200 uppercase tracking-tight">Enterprise</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">₱199</span>
                        <span className="text-zinc-600 text-xs font-mono">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> UNLIMITED VISUALS
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> ULTRA HD (4K)
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> CUSTOM AI MEDIUMS
                      </li>
                      <li className="flex items-center gap-3 text-xs text-zinc-500 font-mono uppercase tracking-tight">
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" /> COMMERCIAL LICENSE
                      </li>
                    </ul>
                    <button className="w-full py-4 font-bold bg-white text-black hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest">Contact Sales</button>
                  </div>
                </div>

                <p className="text-center mt-12 text-zinc-600 text-[10px] font-mono flex items-center justify-center gap-2 uppercase tracking-widest">
                  <CreditCard className="w-3 h-3" /> Encrypted payment via GCash, Maya, or Credit Card.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-zinc-900 rounded-none transition-colors text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-bold tracking-tighter mb-8 text-white uppercase">Privacy <span className="text-cyan-500">Protocol</span></h2>
                
                <div className="space-y-6 text-zinc-500 text-sm leading-relaxed font-mono uppercase tracking-tight">
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">01. DATA COLLECTION</h3>
                    <p>We collect the images you upload for the sole purpose of generating visualizations. These images are processed by Google Gemini AI and are not stored permanently on our servers unless you explicitly save them.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">02. DATA USAGE</h3>
                    <p>Your data is used to provide and improve the ProductVisualizerAI service. We do not sell your personal information or uploaded content to third parties.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">03. NEURAL PROCESSING</h3>
                    <p>By using this service, you acknowledge that your uploaded images are processed by Google's Gemini AI models. Please refer to Google's Privacy Policy for more information on how they handle data.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="w-full mt-12 bg-zinc-900 text-zinc-400 py-4 font-bold hover:bg-zinc-800 transition-all uppercase text-xs tracking-widest border border-zinc-800"
                >
                  CLOSE PROTOCOL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-zinc-900 rounded-none transition-colors text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-bold tracking-tighter mb-8 text-white uppercase">Terms of <span className="text-cyan-500">Service</span></h2>
                
                <div className="space-y-6 text-zinc-500 text-sm leading-relaxed font-mono uppercase tracking-tight">
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">01. ACCEPTANCE</h3>
                    <p>By accessing or using ProductVisualizerAI, you agree to be bound by these Terms of Service.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">02. USAGE</h3>
                    <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for any content you upload.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-zinc-200 mb-2 tracking-tighter">03. INTELLECTUAL PROPERTY</h3>
                    <p>You retain ownership of the original images you upload. ProductVisualizerAI retains ownership of the underlying AI technology and platform.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowTerms(false)}
                  className="w-full mt-12 bg-zinc-900 text-zinc-400 py-4 font-bold hover:bg-zinc-800 transition-all uppercase text-xs tracking-widest border border-zinc-800"
                >
                  CLOSE TERMS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
