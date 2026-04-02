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
    <div className="min-h-screen text-stone-800 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center shadow-sm">
              <Layout className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">ProductVisualizer <span className="text-stone-400 font-light">by Seph</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-stone-500">
            <button 
              onClick={() => setShowHowItWorks(true)}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button 
              onClick={() => setShowMediums(true)}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Mediums
            </button>
            <button 
              onClick={() => setShowPricing(true)}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
          <button className="bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-800 transition-all shadow-sm active:scale-95">
            Get Started
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          
          {/* Left Column: Controls */}
          <div className="space-y-12">
            <section>
              <h1 className="text-7xl font-serif italic tracking-tight leading-[1.1] mb-6 text-stone-900">
                Visualize your <br />
                <span className="text-stone-400">product</span> anywhere.
              </h1>
              <p className="text-stone-500 text-xl max-w-md font-light leading-relaxed">
                Upload a product image and see it instantly rendered on various marketing mediums using advanced AI.
              </p>
            </section>

            {/* Upload Area */}
            <section className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">01. Upload Product Image</h2>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed p-16 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 text-center group rounded-3xl",
                  isDragActive ? "border-stone-400 bg-stone-50" : "border-stone-200 hover:border-stone-300 bg-white",
                  originalImage ? "border-stone-300 bg-stone-50" : "soft-shadow"
                )}
              >
                <input {...getInputProps()} />
                {originalImage ? (
                  <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg border border-stone-200">
                    <img 
                      src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} 
                      alt="Original" 
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <p className="text-stone-900 font-bold flex items-center gap-2 uppercase text-xs tracking-widest bg-white/90 px-4 py-2 rounded-full shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Change Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform border border-stone-100">
                      <Upload className="text-stone-400 w-10 h-10 group-hover:text-stone-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl text-stone-800">Drop your product image here</p>
                      <p className="text-stone-400 text-sm mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Medium Selection */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">02. Select Marketing Medium</h2>
                <div className="relative w-56">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    type="text" 
                    placeholder="Search mediums..."
                    value={mediumSearch}
                    onChange={(e) => setMediumSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-full text-sm focus:border-stone-400 outline-none transition-all text-stone-700 placeholder:text-stone-300 shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredMediums.slice(0, 5).map((medium) => (
                  <button
                    key={medium.id}
                    onClick={() => setSelectedMedium(medium)}
                    className={cn(
                      "p-6 border transition-all text-left flex flex-col gap-4 group rounded-2xl",
                      selectedMedium.id === medium.id 
                        ? "border-stone-900 bg-stone-900 text-white shadow-md" 
                        : "border-stone-200 hover:border-stone-300 bg-white hover:shadow-sm"
                    )}
                  >
                    <medium.icon className={cn(
                      "w-7 h-7 transition-colors",
                      selectedMedium.id === medium.id ? "text-white" : "text-stone-400 group-hover:text-stone-600"
                    )} />
                    <span className="font-semibold text-sm tracking-tight">{medium.name}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setShowMediums(true)}
                  className="p-6 border-2 border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-center flex flex-col items-center justify-center gap-2 group rounded-2xl"
                >
                  <span className="text-stone-900 font-bold text-sm">+ {MEDIUMS.length - 5} More</span>
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">View All</span>
                </button>
              </div>
            </section>

            {/* Resolution & Aspect Ratio Selection */}
            <div className="grid sm:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">03. Select Resolution</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-2xl w-fit">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setSelectedResolution(res.id)}
                      className={cn(
                        "px-5 py-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-0.5 rounded-xl",
                        selectedResolution === res.id 
                          ? "bg-white text-stone-900 shadow-sm" 
                          : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                      <span>{res.name}</span>
                      <span className="text-[9px] opacity-60 uppercase tracking-tighter">{res.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">04. Aspect Ratio</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-2xl w-fit">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedAspectRatio(ratio.id)}
                      className={cn(
                        "px-4 py-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-0.5 min-w-[70px] rounded-xl",
                        selectedAspectRatio === ratio.id 
                          ? "bg-white text-stone-900 shadow-sm" 
                          : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                      <span>{ratio.name}</span>
                      <span className="text-[9px] opacity-60 uppercase tracking-tighter">{ratio.label}</span>
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
                "w-full py-6 rounded-2xl font-bold text-xl tracking-tight transition-all flex items-center justify-center gap-4 shadow-lg",
                !originalImage || isGenerating 
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200" 
                  : "bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] shadow-stone-200"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-7 h-7 fill-current" />
                  Generate Visualization
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
          <div className="sticky top-32">
            <div className="relative w-full bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden soft-shadow" style={{ aspectRatio: selectedAspectRatio.replace(':', '/') }}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-white/80 backdrop-blur-md"
                  >
                    <div className="relative">
                      <div className="w-28 h-28 border-4 border-stone-100 rounded-full animate-pulse" />
                      <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-stone-900 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-2xl text-stone-900 tracking-tight">Creating your visual</p>
                      <p className="text-stone-400 text-sm mt-2">AI is painting your product into the scene...</p>
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 group"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Generated Result" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <button 
                        onClick={handleDownload}
                        className="bg-stone-900 text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-3 hover:bg-stone-800 transition-all active:scale-95"
                      >
                        <Download className="w-6 h-6" /> DOWNLOAD
                      </button>
                      <button 
                        onClick={() => setGeneratedImage(null)}
                        className="bg-white/90 backdrop-blur-md text-stone-900 border border-stone-200 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-3 hover:bg-stone-50 transition-all active:scale-95"
                      >
                        <RefreshCw className="w-6 h-6" /> RESET
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-stone-50/50 text-stone-400 p-16 text-center"
                  >
                    <div className="w-24 h-24 border-2 border-dashed border-stone-200 rounded-3xl flex items-center justify-center bg-white">
                      <ImageIcon className="w-12 h-12 text-stone-200" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl text-stone-800 tracking-tight">PREVIEW AREA</p>
                      <p className="text-sm max-w-[240px] mx-auto mt-3 text-stone-400 leading-relaxed">Your generated visualization will appear here in high resolution.</p>
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
                className="mt-8 p-8 bg-white border border-stone-200 rounded-3xl soft-shadow space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Refine Visualization</h2>
                  <span className="text-[10px] bg-stone-50 text-stone-500 px-3 py-1 rounded-full font-bold border border-stone-100 tracking-widest">AI ASSISTANT</span>
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g. Add more sunlight, change background..."
                    className="flex-grow px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:border-stone-400 outline-none transition-all text-stone-800 placeholder:text-stone-300"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={!refinementPrompt || isGenerating}
                    className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all disabled:bg-stone-100 disabled:text-stone-300 flex items-center gap-3 active:scale-95 shadow-md"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                    ADJUST
                  </button>
                </div>
                <p className="text-xs text-stone-400 italic">Describe any changes you'd like to make to the result.</p>
              </motion.div>
            )}

            {/* Stats/Info */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              <div className="bg-white p-6 border border-stone-100 rounded-2xl soft-shadow">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Resolution</p>
                <p className="font-bold text-stone-800">1024 x 1024</p>
              </div>
              <div className="bg-white p-6 border border-stone-100 rounded-2xl soft-shadow">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">AI Model</p>
                <p className="font-bold text-stone-800">Gemini 3.1</p>
              </div>
              <div className="bg-white p-6 border border-stone-100 rounded-2xl soft-shadow">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Quality</p>
                <p className="font-bold text-stone-900">PREMIUM</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-20 mt-32 bg-stone-50/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all cursor-default">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <Layout className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">ProductVisualizer <span className="text-stone-400 font-light">by Seph</span></span>
          </div>
          <p className="text-stone-400 text-xs font-medium tracking-wide">© 2026 PRODUCTVISUALIZER BY SEPH. POWERED BY GOOGLE GEMINI.</p>
          <div className="flex gap-10 text-stone-500 text-sm font-semibold tracking-wide">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-stone-900 transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-stone-900 transition-colors cursor-pointer">Terms</button>
            <a href="mailto:argeljosephtam94@gmail.com" className="hover:text-stone-900 transition-colors">Contact</a>
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
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 md:p-16">
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-4xl font-serif italic tracking-tight mb-10 text-stone-900">How it works</h2>
                
                <div className="space-y-10">
                  <div className="flex gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-900 border border-stone-100 flex items-center justify-center font-bold shrink-0 shadow-sm">1</div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2 text-stone-900">Upload your product</h3>
                      <p className="text-stone-500 leading-relaxed">Drag and drop or click to upload a high-quality image of your product. For best results, use an image with a clean background.</p>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-900 border border-stone-100 flex items-center justify-center font-bold shrink-0 shadow-sm">2</div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2 text-stone-900">Select a medium</h3>
                      <p className="text-stone-500 leading-relaxed">Choose from our curated list of marketing mediums like coffee mugs, billboards, or t-shirts where you want to see your product.</p>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-900 border border-stone-100 flex items-center justify-center font-bold shrink-0 shadow-sm">3</div>
                    <div>
                      <h3 className="font-semibold text-xl mb-2 text-stone-900">Generate & Download</h3>
                      <p className="text-stone-500 leading-relaxed">Click generate and let our AI handle the rest. Once finished, you can download your professional visualization instantly.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="w-full mt-14 bg-stone-900 text-white py-5 rounded-2xl font-bold hover:bg-stone-800 transition-all active:scale-95 shadow-lg"
                >
                  Start Visualizing
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
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 md:p-16 overflow-y-auto">
                <button 
                  onClick={() => setShowMediums(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div>
                    <h2 className="text-5xl font-serif italic tracking-tight mb-3 text-stone-900">Available Mediums</h2>
                    <p className="text-stone-400 font-medium">Explore professional settings for your product visualization.</p>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Search for a medium..."
                      value={mediumSearch}
                      onChange={(e) => setMediumSearch(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-stone-50 border border-stone-100 rounded-full focus:border-stone-300 outline-none transition-all text-stone-700 placeholder:text-stone-300 shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredMediums.map((medium) => (
                    <div 
                      key={medium.id}
                      className="p-8 border border-stone-100 bg-white hover:bg-stone-50 hover:border-stone-200 transition-all group cursor-pointer rounded-2xl soft-shadow"
                      onClick={() => {
                        setSelectedMedium(medium);
                        setShowMediums(false);
                      }}
                    >
                      <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white transition-all">
                        <medium.icon className="w-7 h-7 text-stone-900" />
                      </div>
                      <h3 className="font-semibold text-xl mb-2 text-stone-900">{medium.name}</h3>
                      <p className="text-stone-500 text-sm leading-relaxed">{medium.description}</p>
                      <div className="mt-6 text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2 transition-colors">
                        SELECT MEDIUM <Zap className="w-4 h-4 fill-current" />
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
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 md:p-20">
                <button 
                  onClick={() => setShowPricing(false)}
                  className="absolute top-10 right-10 p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-20">
                  <span className="bg-stone-50 text-stone-500 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block border border-stone-100">Pricing Plans</span>
                  <h2 className="text-6xl font-serif italic tracking-tight mb-6 text-stone-900">Simple, transparent pricing.</h2>
                  <p className="text-stone-400 max-w-lg mx-auto font-medium">High-performance visualization for every creator.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Free Plan */}
                  <div className="bg-white p-10 border border-stone-100 flex flex-col hover:border-stone-200 transition-all rounded-3xl soft-shadow">
                    <div className="mb-10">
                      <h3 className="font-semibold text-2xl mb-3 text-stone-900">Basic</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-stone-900">₱0</span>
                        <span className="text-stone-400 text-sm font-semibold">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-5 mb-12 flex-grow">
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> 5 Visuals / mo
                      </li>
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Standard Resolution
                      </li>
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Basic Mediums
                      </li>
                    </ul>
                    <button className="w-full py-5 font-bold border border-stone-200 text-stone-400 rounded-2xl hover:bg-stone-50 transition-all uppercase text-xs tracking-widest">Current Tier</button>
                  </div>

                  {/* Creator Plan */}
                  <div className="bg-stone-900 p-10 border-2 border-stone-900 shadow-2xl flex flex-col relative transform scale-105 z-10 rounded-3xl">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-stone-800">Most Popular</div>
                    <div className="mb-10">
                      <h3 className="font-semibold text-2xl mb-3 flex items-center gap-3 text-white">Creator <Star className="w-5 h-5 text-white fill-current" /></h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-white">₱49</span>
                        <span className="text-stone-400 text-sm font-semibold">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-5 mb-12 flex-grow">
                      <li className="flex items-center gap-4 text-stone-200 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" /> 50 Visuals / mo
                      </li>
                      <li className="flex items-center gap-4 text-stone-200 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" /> HD Resolution
                      </li>
                      <li className="flex items-center gap-4 text-stone-200 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" /> All Mediums
                      </li>
                      <li className="flex items-center gap-4 text-stone-200 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-white shrink-0" /> No Watermarks
                      </li>
                    </ul>
                    <button className="w-full py-5 font-bold bg-white text-stone-900 rounded-2xl hover:bg-stone-100 transition-all shadow-lg uppercase text-xs tracking-widest">Upgrade Now</button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-white p-10 border border-stone-100 flex flex-col hover:border-stone-200 transition-all rounded-3xl soft-shadow">
                    <div className="mb-10">
                      <h3 className="font-semibold text-2xl mb-3 text-stone-900">Enterprise</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-stone-900">₱199</span>
                        <span className="text-stone-400 text-sm font-semibold">/MO</span>
                      </div>
                    </div>
                    <ul className="space-y-5 mb-12 flex-grow">
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Unlimited Visuals
                      </li>
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Ultra HD (4K)
                      </li>
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Custom AI Mediums
                      </li>
                      <li className="flex items-center gap-4 text-stone-500 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0" /> Commercial License
                      </li>
                    </ul>
                    <button className="w-full py-5 font-bold bg-stone-50 text-stone-900 rounded-2xl hover:bg-stone-100 transition-all uppercase text-xs tracking-widest">Contact Sales</button>
                  </div>
                </div>

                <p className="text-center mt-16 text-stone-400 text-xs font-medium flex items-center justify-center gap-3">
                  <CreditCard className="w-4 h-4" /> Secure payment via GCash, Maya, or Credit Card.
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
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-10 md:p-16">
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-4xl font-serif italic tracking-tight mb-10 text-stone-900">Privacy Policy</h2>
                
                <div className="space-y-8 text-stone-500 leading-relaxed">
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">01. Data Collection</h3>
                    <p>We collect the images you upload for the sole purpose of generating visualizations. These images are processed by Google Gemini AI and are not stored permanently on our servers unless you explicitly save them.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">02. Data Usage</h3>
                    <p>Your data is used to provide and improve the ProductVisualizer service. We do not sell your personal information or uploaded content to third parties.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">03. AI Processing</h3>
                    <p>By using this service, you acknowledge that your uploaded images are processed by Google's Gemini AI models. Please refer to Google's Privacy Policy for more information on how they handle data.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="w-full mt-14 bg-stone-100 text-stone-600 py-5 rounded-2xl font-bold hover:bg-stone-200 transition-all uppercase text-xs tracking-widest"
                >
                  Close Privacy Policy
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
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-10 md:p-16">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-400"
                >
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-4xl font-serif italic tracking-tight mb-10 text-stone-900">Terms of Service</h2>
                
                <div className="space-y-8 text-stone-500 leading-relaxed">
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">01. Acceptance</h3>
                    <p>By accessing or using ProductVisualizer, you agree to be bound by these Terms of Service.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">02. Usage</h3>
                    <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for any content you upload.</p>
                  </section>
                  <section>
                    <h3 className="text-xl font-semibold text-stone-900 mb-3">03. Intellectual Property</h3>
                    <p>You retain ownership of the original images you upload. ProductVisualizer retains ownership of the underlying AI technology and platform.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowTerms(false)}
                  className="w-full mt-14 bg-stone-100 text-stone-600 py-5 rounded-2xl font-bold hover:bg-stone-200 transition-all uppercase text-xs tracking-widest"
                >
                  Close Terms
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
