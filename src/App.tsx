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
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-orange-200">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Layout className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProductVisualizer<span className="text-orange-500">AI</span> by Seph</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <button 
              onClick={() => setShowHowItWorks(true)}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button 
              onClick={() => setShowMediums(true)}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              Mediums
            </button>
            <button 
              onClick={() => setShowPricing(true)}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
          <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all">
            Get Started
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Controls */}
          <div className="space-y-10">
            <section>
              <h1 className="text-5xl font-bold tracking-tighter leading-tight mb-4">
                Visualize your product <br />
                <span className="text-orange-500 italic font-serif">anywhere.</span>
              </h1>
              <p className="text-gray-500 text-lg max-w-md">
                Upload a product image and see it instantly rendered on various marketing mediums using advanced AI.
              </p>
            </section>

            {/* Upload Area */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">1. Upload Product Image</h2>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center group",
                  isDragActive ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-gray-50",
                  originalImage ? "border-green-500 bg-green-50" : ""
                )}
              >
                <input {...getInputProps()} />
                {originalImage ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} 
                      alt="Original" 
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Change Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="text-gray-400 w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Drop your product image here</p>
                      <p className="text-gray-400 text-sm">PNG, JPG or WEBP (Max 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Medium Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">2. Select Marketing Medium</h2>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search mediums..."
                    value={mediumSearch}
                    onChange={(e) => setMediumSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-100 rounded-full text-xs focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMediums.slice(0, 5).map((medium) => (
                  <button
                    key={medium.id}
                    onClick={() => setSelectedMedium(medium)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group",
                      selectedMedium.id === medium.id 
                        ? "border-orange-500 bg-orange-50 ring-4 ring-orange-100" 
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    )}
                  >
                    <medium.icon className={cn(
                      "w-6 h-6 transition-colors",
                      selectedMedium.id === medium.id ? "text-orange-500" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    <span className="font-semibold text-sm">{medium.name}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setShowMediums(true)}
                  className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-center flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-orange-500 font-bold text-sm">+ {MEDIUMS.length - 5} More</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">View All</span>
                </button>
              </div>
            </section>

            {/* Resolution & Aspect Ratio Selection */}
            <div className="grid sm:grid-cols-2 gap-6">
              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">3. Select Resolution</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setSelectedResolution(res.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5",
                        selectedResolution === res.id 
                          ? "bg-white text-orange-500 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <span>{res.name}</span>
                      <span className="text-[8px] opacity-60">{res.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">4. Aspect Ratio</h2>
                <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedAspectRatio(ratio.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 min-w-[60px]",
                        selectedAspectRatio === ratio.id 
                          ? "bg-white text-orange-500 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
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
                "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl",
                !originalImage || isGenerating 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98] hover:shadow-orange-200"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Visualizing with AI...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Generate Visualization
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result Display */}
          <div className="sticky top-28">
            <div className="relative w-full bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-inner border-8 border-white" style={{ aspectRatio: selectedAspectRatio.replace(':', '/') }}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-50"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-orange-100 rounded-full animate-pulse" />
                      <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-orange-500 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl">Creating Magic</p>
                      <p className="text-gray-400 text-sm">Our AI is placing your product on a {selectedMedium.name}...</p>
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
                        className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-5 h-5" /> Download
                      </button>
                      <button 
                        onClick={() => setGeneratedImage(null)}
                        className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-black transition-colors"
                      >
                        <RefreshCw className="w-5 h-5" /> Reset
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-100 text-gray-400 p-12 text-center"
                  >
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-gray-500">Visualization Preview</p>
                      <p className="text-sm max-w-[200px] mx-auto mt-2">Upload an image and click generate to see the magic happen.</p>
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
                className="mt-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Adjust Product Design</h2>
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">AI POWERED</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g. Change background to blue, make it sunset..."
                    className="flex-grow px-4 py-3 rounded-2xl border border-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={!refinementPrompt || isGenerating}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Adjust
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 italic">Describe how you want to change the generated image above.</p>
              </motion.div>
            )}

            {/* Stats/Info */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Resolution</p>
                <p className="font-bold">1024 x 1024</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">AI Model</p>
                <p className="font-bold">Gemini 2.5</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Consistency</p>
                <p className="font-bold text-green-500">High</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Layout className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">ProductVisualizerAI by Seph</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 ProductVisualizerAI by Seph. Powered by Google Gemini.</p>
          <div className="flex gap-6 text-gray-400 text-sm font-medium">
            <button onClick={() => setShowPrivacy(true)} className="hover:text-black transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => setShowTerms(true)} className="hover:text-black transition-colors cursor-pointer">Terms</button>
            <a href="mailto:argeljosephtam94@gmail.com" className="hover:text-black transition-colors">Contact</a>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-3xl font-bold tracking-tight mb-8">How to use <span className="text-orange-500">ProductVisualizerAI</span></h2>
                
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Upload your product</h3>
                      <p className="text-gray-500">Drag and drop or click to upload a high-quality image of your product. For best results, use an image with a clean background.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Select a medium</h3>
                      <p className="text-gray-500">Choose from our curated list of marketing mediums like coffee mugs, billboards, or t-shirts where you want to see your product.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Generate & Download</h3>
                      <p className="text-gray-500">Click generate and let our AI handle the rest. Once finished, you can download your professional visualization instantly.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHowItWorks(false)}
                  className="w-full mt-12 bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all"
                >
                  Got it, let's go!
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowMediums(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>

                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Available <span className="text-orange-500">Mediums</span></h2>
                    <p className="text-gray-500">Explore all the professional settings where you can visualize your product.</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search for a medium..."
                      value={mediumSearch}
                      onChange={(e) => setMediumSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl focus:bg-white border border-transparent focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMediums.map((medium) => (
                    <div 
                      key={medium.id}
                      className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:border-orange-200 transition-all group"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <medium.icon className="w-6 h-6 text-orange-500" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{medium.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{medium.description}</p>
                      <button 
                        onClick={() => {
                          setSelectedMedium(medium);
                          setShowMediums(false);
                        }}
                        className="mt-4 text-xs font-bold uppercase tracking-widest text-orange-500 hover:text-orange-600 flex items-center gap-1"
                      >
                        Select this medium <Zap className="w-3 h-3" />
                      </button>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#fafafa] rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-16">
                <button 
                  onClick={() => setShowPricing(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>

                <div className="text-center mb-16">
                  <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">Student Friendly</span>
                  <h2 className="text-5xl font-bold tracking-tight mb-4">Simple, <span className="text-orange-500 italic font-serif">honest</span> pricing.</h2>
                  <p className="text-gray-500 max-w-lg mx-auto">High-quality visualizations shouldn't break the bank. Choose the plan that fits your needs.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Free Plan */}
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2">Free</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₱0</span>
                        <span className="text-gray-400 text-sm">/month</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> 5 visualizations / month
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Standard resolution
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Basic mediums
                      </li>
                    </ul>
                    <button className="w-full py-4 rounded-2xl font-bold border-2 border-gray-100 hover:bg-gray-50 transition-all">Current Plan</button>
                  </div>

                  {/* Student Plan */}
                  <div className="bg-white p-8 rounded-[2rem] border-2 border-orange-500 shadow-xl shadow-orange-100 flex flex-col relative transform scale-105 z-10">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2 flex items-center gap-2">Student <Star className="w-4 h-4 text-orange-500 fill-orange-500" /></h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₱49</span>
                        <span className="text-gray-400 text-sm">/month</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> 50 visualizations / month
                      </li>
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> High definition (2K)
                      </li>
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> All 10+ mediums
                      </li>
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" /> No watermarks
                      </li>
                    </ul>
                    <button className="w-full py-4 rounded-2xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">Upgrade Now</button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
                    <div className="mb-8">
                      <h3 className="font-bold text-xl mb-2">Pro</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₱199</span>
                        <span className="text-gray-400 text-sm">/month</span>
                      </div>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Unlimited visualizations
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Ultra HD (4K)
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Custom mediums via AI
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-500">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Commercial license
                      </li>
                    </ul>
                    <button className="w-full py-4 rounded-2xl font-bold bg-black text-white hover:bg-gray-800 transition-all">Go Pro</button>
                  </div>
                </div>

                <p className="text-center mt-12 text-gray-400 text-xs flex items-center justify-center gap-2">
                  <CreditCard className="w-3 h-3" /> Secure payment via GCash, Maya, or Credit Card.
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-3xl font-bold tracking-tight mb-8">Privacy <span className="text-orange-500">Policy</span></h2>
                
                <div className="prose prose-orange max-w-none space-y-6 text-gray-600">
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">1. Information We Collect</h3>
                    <p>We collect the images you upload for the sole purpose of generating visualizations. These images are processed by Google Gemini AI and are not stored permanently on our servers unless you explicitly save them.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">2. How We Use Your Data</h3>
                    <p>Your data is used to provide and improve the ProductVisualizerAI service. We do not sell your personal information or uploaded content to third parties.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">3. AI Processing</h3>
                    <p>By using this service, you acknowledge that your uploaded images are processed by Google's Gemini AI models. Please refer to Google's Privacy Policy for more information on how they handle data.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">4. Security</h3>
                    <p>We implement industry-standard security measures to protect your data during transmission and processing.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="w-full mt-12 bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all"
                >
                  Close
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setShowTerms(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>

                <h2 className="text-3xl font-bold tracking-tight mb-8">Terms of <span className="text-orange-500">Service</span></h2>
                
                <div className="prose prose-orange max-w-none space-y-6 text-gray-600">
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">1. Acceptance of Terms</h3>
                    <p>By accessing or using ProductVisualizerAI, you agree to be bound by these Terms of Service.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">2. Use of Service</h3>
                    <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You are responsible for any content you upload.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">3. Intellectual Property</h3>
                    <p>You retain ownership of the original images you upload. ProductVisualizerAI retains ownership of the underlying AI technology and platform.</p>
                  </section>
                  <section>
                    <h3 className="text-lg font-bold text-black mb-2">4. Limitation of Liability</h3>
                    <p>ProductVisualizerAI is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowTerms(false)}
                  className="w-full mt-12 bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
