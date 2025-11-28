
import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, AnalysisState, AppMode, PitchTone, PitchLength, OutputLanguage } from './types';
import { analyzeBusinessImage, searchBusinessLeads, analyzeBusinessGap } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import AnalysisResult from './components/AnalysisResult';
import { ScanSearch, Play, AlertTriangle, MapPin, Search, Image as ImageIcon, Settings2, ClipboardCheck, ArrowRight, Globe, Store, Mic, MicOff } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('IMAGE');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [businessName, setBusinessName] = useState(''); // New state for Business Name
  const [searchQuery, setSearchQuery] = useState('');
  const [auditDescription, setAuditDescription] = useState('');
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Pitch Configuration State
  const [pitchTone, setPitchTone] = useState<PitchTone>('STANDARD');
  const [pitchLength, setPitchLength] = useState<PitchLength>('STANDARD');
  const [language, setLanguage] = useState<OutputLanguage>('English');
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    groundingMetadata: null,
    error: null,
  });

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    // Input Validation: Ensure Business Name is a non-empty string
    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      setAnalysisState(prev => ({ ...prev, error: "Please enter a valid Business Name before proceeding." }));
      return;
    }

    setAnalysisState({ isLoading: true, result: null, groundingMetadata: null, error: null });

    try {
      const response = await analyzeBusinessImage(selectedImage.file, businessName.trim(), pitchTone, pitchLength, language);
      setAnalysisState({ 
        isLoading: false, 
        result: response.text, 
        groundingMetadata: response.groundingMetadata,
        error: null 
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setAnalysisState({ isLoading: false, result: null, groundingMetadata: null, error: errorMessage });
    }
  };

  const handleSearchLeads = async () => {
    if (!searchQuery.trim()) return;

    setAnalysisState({ isLoading: true, result: null, groundingMetadata: null, error: null });

    try {
      const response = await searchBusinessLeads(searchQuery, pitchTone, pitchLength, language);
      setAnalysisState({ 
        isLoading: false, 
        result: response.text, 
        groundingMetadata: response.groundingMetadata,
        error: null 
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setAnalysisState({ isLoading: false, result: null, groundingMetadata: null, error: errorMessage });
    }
  };

  const handleSelfAudit = async () => {
    if (!auditDescription.trim()) return;

    setAnalysisState({ isLoading: true, result: null, groundingMetadata: null, error: null });

    try {
      const response = await analyzeBusinessGap(auditDescription, language);
      setAnalysisState({ 
        isLoading: false, 
        result: response.text, 
        groundingMetadata: response.groundingMetadata,
        error: null 
      });
    } catch (err) {
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setAnalysisState({ isLoading: false, result: null, groundingMetadata: null, error: errorMessage });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Map selected output language to speech recognition language
    const langMap: Record<OutputLanguage, string> = {
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'Portuguese (Portugal)': 'pt-PT',
      'Portuguese (Brazil)': 'pt-BR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Dutch': 'nl-NL',
      'Chinese': 'zh-CN',
      'Japanese': 'ja-JP'
    };
    recognition.lang = langMap[language] || 'en-US';

    // Store the initial text so we can append to it correctly
    let initialText = auditDescription;
    // But if we want continuous appending without resetting, we handle results carefully
    // Actually, simpler approach: Update state on every final result.
    
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // We append the new transcript to the current text
      if (finalTranscript) {
         setAuditDescription(prev => {
             const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
             return prev + separator + finalTranscript;
         });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const isAnalyzing = analysisState.isLoading;

  const supportedLanguages: OutputLanguage[] = [
    'English', 'Spanish', 'French', 'Portuguese (Portugal)', 'Portuguese (Brazil)', 'German', 'Italian', 'Dutch', 'Chinese', 'Japanese'
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-lg" aria-hidden="true">
              <ScanSearch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">LeadLens AI</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Identify clients & optimize businesses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Gemini Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" role="main">
        
        {!process.env.API_KEY && (
           <div role="alert" className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" aria-hidden="true" />
             <div>
               <h3 className="font-bold text-amber-800">Missing API Key</h3>
               <p className="text-amber-700 text-sm">
                 The Gemini API key is missing. Please add it to your environment variables to use this application.
               </p>
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Mode Switcher */}
            <div role="group" aria-label="Application Mode" className="flex flex-wrap sm:flex-nowrap bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setMode('IMAGE')}
                aria-pressed={mode === 'IMAGE'}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap ${
                  mode === 'IMAGE' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                Analyze Image
              </button>
              <button
                onClick={() => setMode('SEARCH')}
                aria-pressed={mode === 'SEARCH'}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap ${
                  mode === 'SEARCH' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                Search Maps
              </button>
              <button
                onClick={() => setMode('SELF_AUDIT')}
                aria-pressed={mode === 'SELF_AUDIT'}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap ${
                  mode === 'SELF_AUDIT' 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                Self Audit
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col">
              
              {mode === 'IMAGE' && (
                <>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Upload Lead Image</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Take a photo of a business card, storefront, or flyer. We'll find opportunities for websites & automations.
                  </p>
                  
                  {/* Business Name Input */}
                  <div className="mb-4">
                    <label htmlFor="businessName" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Joe's Pizza, Downtown Law Firm"
                      disabled={isAnalyzing}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <ImageUploader 
                    selectedImage={selectedImage} 
                    onImageSelect={setSelectedImage} 
                    disabled={isAnalyzing}
                  />

                  {/* Pitch Configuration Settings */}
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label htmlFor="language" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Output Language
                      </label>
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        {supportedLanguages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="pitchTone" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        Pitch Strategy
                      </label>
                      <select
                        id="pitchTone"
                        value={pitchTone}
                        onChange={(e) => setPitchTone(e.target.value as PitchTone)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        <option value="STANDARD">Friendly Intro</option>
                        <option value="PAIN_FOCUSED">Pain-Focused (Direct)</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="pitchLength" className="block text-xs font-semibold text-slate-600 mb-1.5">Pitch Length</label>
                      <select
                        id="pitchLength"
                        value={pitchLength}
                        onChange={(e) => setPitchLength(e.target.value as PitchLength)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        <option value="STANDARD">Standard Email</option>
                        <option value="SHORT">Short (Twitter/DM)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeImage}
                    disabled={!selectedImage || !businessName.trim() || isAnalyzing || !process.env.API_KEY}
                    aria-busy={isAnalyzing}
                    className={`
                      w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      ${
                        !selectedImage || !businessName.trim() || isAnalyzing || !process.env.API_KEY
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-[0.98]'
                      }
                    `}
                  >
                    {isAnalyzing ? 'Processing...' : (
                      <>
                        <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                        Analyze Opportunity
                      </>
                    )}
                  </button>
                </>
              )}

              {mode === 'SEARCH' && (
                <>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Find Local Leads</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Search Google Maps for businesses in your target niche (e.g., "Landscapers in Austin, TX").
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="e.g. Bakeries in Brooklyn"
                      aria-label="Search business leads by niche and location"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchLeads()}
                      disabled={isAnalyzing}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span id="suggestions-label">Try:</span>
                    <button aria-describedby="suggestions-label" onClick={() => setSearchQuery('Coffee shops without website near me')} className="bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">Coffee shops</button>
                    <button aria-describedby="suggestions-label" onClick={() => setSearchQuery('Dentists in Chicago')} className="bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">Dentists</button>
                    <button aria-describedby="suggestions-label" onClick={() => setSearchQuery('Roofing companies in Miami')} className="bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">Roofers</button>
                  </div>

                  {/* Pitch Configuration Settings */}
                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label htmlFor="languageSearch" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Output Language
                      </label>
                      <select
                        id="languageSearch"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        {supportedLanguages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="pitchToneSearch" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        Pitch Strategy
                      </label>
                      <select
                        id="pitchToneSearch"
                        value={pitchTone}
                        onChange={(e) => setPitchTone(e.target.value as PitchTone)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        <option value="STANDARD">Friendly Intro</option>
                        <option value="PAIN_FOCUSED">Pain-Focused (Direct)</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor="pitchLengthSearch" className="block text-xs font-semibold text-slate-600 mb-1.5">Pitch Length</label>
                      <select
                        id="pitchLengthSearch"
                        value={pitchLength}
                        onChange={(e) => setPitchLength(e.target.value as PitchLength)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        <option value="STANDARD">Standard Email</option>
                        <option value="SHORT">Short (Twitter/DM)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSearchLeads}
                    disabled={!searchQuery.trim() || isAnalyzing || !process.env.API_KEY}
                    aria-busy={isAnalyzing}
                    className={`
                      w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      ${
                        !searchQuery.trim() || isAnalyzing || !process.env.API_KEY
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-[0.98]'
                      }
                    `}
                  >
                    {isAnalyzing ? 'Searching...' : (
                      <>
                        <Search className="w-5 h-5" aria-hidden="true" />
                        Find Leads
                      </>
                    )}
                  </button>
                </>
              )}

              {mode === 'SELF_AUDIT' && (
                <>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Business Gap Audit</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Describe your business operations to spot profit leaks and missing automations.
                  </p>

                  <div className="relative flex-1 flex flex-col">
                    <label htmlFor="auditInput" className="sr-only">Describe your business</label>
                    <textarea
                      id="auditInput"
                      value={auditDescription}
                      onChange={(e) => setAuditDescription(e.target.value)}
                      placeholder="e.g. I run a pool cleaning service. We schedule via text messages and use a whiteboard. Invoicing is done manually at the end of the month, and we often forget..."
                      className="w-full h-40 p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 resize-none pr-12"
                    />
                    
                    {/* Voice Input Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`
                        absolute right-3 bottom-3 p-2 rounded-full shadow-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500
                        ${isListening 
                          ? 'bg-red-50 border-red-200 text-red-600 animate-pulse hover:bg-red-100' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300'}
                      `}
                      aria-label={isListening ? "Stop voice recording" : "Start voice recording"}
                      title={isListening ? "Stop recording" : "Dictate description"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="mt-2 flex justify-between text-xs text-slate-400">
                       <span>Be as specific as possible about your pain points.</span>
                       {isListening && <span className="text-red-500 font-medium animate-pulse">Recording...</span>}
                    </div>
                  </div>

                  {/* Audit Configuration Settings */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     <div className="w-full">
                       <label htmlFor="languageAudit" className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Output Language
                      </label>
                      <select
                        id="languageAudit"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
                        disabled={isAnalyzing}
                        className="w-full text-sm rounded-lg border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-indigo-500 py-2"
                      >
                        {supportedLanguages.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSelfAudit}
                    disabled={!auditDescription.trim() || isAnalyzing || !process.env.API_KEY}
                    aria-busy={isAnalyzing}
                    className={`
                      w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      ${
                        !auditDescription.trim() || isAnalyzing || !process.env.API_KEY
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-[0.98]'
                      }
                    `}
                  >
                    {isAnalyzing ? 'Analyzing...' : (
                      <>
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        Start Gap Analysis
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Tips Section */}
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-md overflow-hidden relative" role="complementary" aria-label="Usage Tips">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" aria-hidden="true"></div>
              <div className="relative z-10">
                <h3 className="font-semibold text-indigo-100 mb-2">
                  {mode === 'IMAGE' ? 'How Image Audit works' : mode === 'SEARCH' ? 'How Map Search works' : 'How Self Audit works'}
                </h3>
                <ul className="space-y-3 text-sm text-indigo-200">
                  {mode === 'IMAGE' ? (
                    <>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">1</span>
                        Upload a photo of a local business.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">2</span>
                        AI analyzes their branding & needs.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">3</span>
                        Get a ready-to-send cold pitch.
                      </li>
                    </>
                  ) : mode === 'SEARCH' ? (
                    <>
                       <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">1</span>
                        Enter a business niche and location.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">2</span>
                        Gemini scans Google Maps for real businesses.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">3</span>
                        Get outreach templates for these leads.
                      </li>
                    </>
                  ) : (
                    <>
                       <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">1</span>
                        Describe your current workflows.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">2</span>
                        AI spots "leaks" where you lose money/time.
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">3</span>
                        Get a Web & Automation fix list.
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 h-full min-h-[500px]" role="region" aria-label="Analysis Results">
            <AnalysisResult 
              result={analysisState.result} 
              groundingMetadata={analysisState.groundingMetadata}
              isLoading={analysisState.isLoading} 
              error={analysisState.error}
              mode={mode}
              language={language}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
