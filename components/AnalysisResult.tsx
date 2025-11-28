
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Sparkles, AlertCircle, MapPin, ExternalLink, Download, MessageCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { AppMode, OutputLanguage } from '../types';

interface AnalysisResultProps {
  result: string | null;
  groundingMetadata: any | null;
  isLoading: boolean;
  error: string | null;
  mode: AppMode;
  language: OutputLanguage;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, groundingMetadata, isLoading, error, mode, language }) => {
  const [copied, setCopied] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = React.useState(false);

  // Status messages for different modes
  const imageSteps = [
    "Uploading and scanning image...",
    "Identifying business details...",
    "Analyzing digital presence gaps...",
    "Formulating sales strategy...",
    "Drafting personalized pitch...",
    "Finalizing report..."
  ];

  const searchSteps = [
    "Connecting to Google Maps...",
    "Searching for local businesses...",
    "Filtering for best opportunities...",
    "Analyzing lead potential...",
    "Drafting outreach templates...",
    "Compiling results..."
  ];

  const auditSteps = [
    "Analyzing business workflow...",
    "Identifying profit leaks...",
    "Detecting automation gaps...",
    "Mapping website solutions...",
    "Creating marketing strategy...",
    "Generating action plan..."
  ];

  let steps = imageSteps;
  if (mode === 'SEARCH') steps = searchSteps;
  if (mode === 'SELF_AUDIT') steps = auditSteps;

  const ctaTranslations: Record<OutputLanguage, string> = {
    English: "Turn these insights into results. Book your N2 Digital Strategy Session",
    'Portuguese (Portugal)': "Transforme estes insights em resultados. Agende a sua Consultoria Estratégica com a N2 Digital",
    'Portuguese (Brazil)': "Transforme esses insights em resultados. Agende sua Consultoria Estratégica com a N2 Digital",
    Spanish: "Convierta estos conocimientos en resultados. Reserve su Consultoría Estratégica con N2 Digital",
    French: "Transformez ces informations en résultats. Réservez votre Consultation Stratégique avec N2 Digital",
    German: "Verwandeln Sie diese Erkenntnisse in Ergebnisse. Buchen Sie Ihre Strategieberatung bei N2 Digital",
    Italian: "Trasforma queste intuizioni in risultati. Prenota la tua Consulenza Strategica con N2 Digital",
    Dutch: "Zet deze inzichten om in resultaten. Boek uw Strategisch Consult bij N2 Digital",
    Chinese: "将这些见解转化为成果。预订 N2 Digital 战略咨询",
    Japanese: "これらの洞察を成果に変えましょう。N2 Digital 戦略コンサルティングを予約してください"
  };

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setMessageIndex(0);
      
      // Simulate progress bar
      const progressInterval = setInterval(() => {
        setProgress(prev => {
           // Fast at first, then slows down
           const remaining = 95 - prev;
           if (remaining <= 0) return prev;
           
           // Logarithmic-ish increment
           const increment = Math.max(0.5, remaining / 15); 
           return prev + increment;
        });
      }, 200);

      // Cycle through status messages
      const messageInterval = setInterval(() => {
         setMessageIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 2000); 

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    } else {
      setProgress(100);
    }
  }, [isLoading, mode, steps.length]);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCSV = () => {
    if (!result) return;

    let csvString = "";
    const hasMapData = groundingMetadata?.groundingChunks?.some((c: any) => c.maps);

    // If we have structured map data (Search Mode), export as a lead list
    if (mode === 'SEARCH' && hasMapData) {
      csvString = "Business Name,Address,Google Maps Link\n";
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) {
          const { title, address, googleMapsUriString } = chunk.maps;
          const row = [
            `"${(title || '').replace(/"/g, '""')}"`,
            `"${(address || '').replace(/"/g, '""')}"`,
            googleMapsUriString
          ].join(",");
          csvString += row + "\n";
        }
      });
    } else {
      // Fallback: Generic Export for Image/Audit or text-only results
      csvString = "Date,Type,Analysis Content\n";
      const safeResult = `"${result.replace(/"/g, '""')}"`;
      csvString += `${new Date().toISOString()},${mode},${safeResult}`;
    }

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leadlens-${mode.toLowerCase()}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppShare = (number: string) => {
    if (!result) return;
    
    // Encode the result for WhatsApp. 
    // Note: URL length limits might apply for very long texts, but modern browsers often handle substantial lengths.
    const text = `*New Lead Diagnosis via LeadLens AI* 🚀\n\n${result}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${number}?text=${encodedText}`;
    
    window.open(url, '_blank');
    setShowWhatsAppMenu(false);
  };

  const renderGroundingChunks = () => {
    if (!groundingMetadata || !groundingMetadata.groundingChunks) return null;

    const chunks = groundingMetadata.groundingChunks.filter((chunk: any) => chunk.web || chunk.maps);
    
    if (chunks.length === 0) return null;

    return (
      <div className="mt-6 pt-6 border-t border-slate-100">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" aria-hidden="true" />
          Identified Locations
        </h4>
        <div className="grid grid-cols-1 gap-2" role="list">
          {chunks.map((chunk: any, index: number) => {
            if (chunk.maps) {
                const mapData = chunk.maps;
                return (
                  <div role="listitem" key={index}>
                    <a 
                      href={mapData.googleMapsUriString} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      aria-label={`View ${mapData.title} in Google Maps`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-sm">{mapData.title}</span>
                        <span className="text-xs text-slate-500">{mapData.address}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </div>
                );
            }
            if (chunk.web) {
                 const webData = chunk.web;
                 return (
                    <div role="listitem" key={index}>
                      <a 
                          href={webData.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          aria-label={`Visit ${webData.title || webData.uri}`}
                      >
                          <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-sm">{webData.title || webData.uri}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </div>
                 );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  const renderSelfAuditCTA = () => {
    if (mode !== 'SELF_AUDIT') return null;
    
    const text = ctaTranslations[language] || ctaTranslations['English'];

    return (
      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex flex-col items-center relative z-10">
             {/* Main clickable CTA Header - Arrow removed */}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleWhatsAppShare('351912281028'); 
              }}
              className="w-full flex items-center justify-center mb-8 transition-transform active:scale-[0.99] cursor-pointer group/link"
            >
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug text-center group-hover/link:text-indigo-100 transition-colors">
                {text}
              </h3>
            </a>
            
            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl px-2">
              <button
                onClick={() => handleWhatsAppShare('351912281028')}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-indigo-50 hover:shadow-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span className="whitespace-nowrap">Chat via WhatsApp 🇵🇹</span>
              </button>
              <button
                onClick={() => handleWhatsAppShare('5517982252250')}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-indigo-50 hover:shadow-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span className="whitespace-nowrap">Chat via WhatsApp 🇧🇷</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div 
        className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 p-8 relative overflow-hidden"
        role="status"
        aria-live="polite"
      >
        {/* Animated Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-transparent to-white/80"></div>
        
         <div className="w-full max-w-xs mb-10 relative z-10">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                <span>Analysis in progress</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden ring-1 ring-slate-200">
                <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                    style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>

        <div className="relative w-24 h-24 mb-8 z-10 flex items-center justify-center" aria-hidden="true">
             {/* Rotating Rings */}
             <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
             <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-[spin_3s_linear_infinite]"></div>
             
             {/* Inner pulsing circle */}
             <div className="absolute inset-4 bg-indigo-50 rounded-full animate-pulse"></div>

             {/* Center Icon */}
             <div className="relative z-10">
                <Sparkles className="w-10 h-10 text-indigo-600 animate-[bounce_2s_infinite]" />
             </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-800 transition-all duration-500 min-h-[28px] text-center z-10">
            {steps[messageIndex]}
        </h3>
        <p className="mt-2 text-slate-500 text-center max-w-sm text-sm z-10">
          Gemini is analyzing {mode === 'IMAGE' ? 'visual features' : mode === 'SEARCH' ? 'local business data' : 'your business workflows'} to identify the best opportunities for you.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full p-6 bg-red-50 rounded-xl border border-red-200 flex items-start gap-4"
        role="alert"
      >
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-medium text-red-900">Analysis Failed</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
        <Sparkles className="w-12 h-12 text-slate-300 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-slate-600">Results Area</h3>
        <p className="text-slate-400 max-w-sm mt-2">
          Your insights, generated sales pitches, and lead data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h2 className="font-semibold text-slate-800">Insights</h2>
        </div>
        
        <div className="flex items-center gap-2 relative">
          {/* WhatsApp Share Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowWhatsAppMenu(!showWhatsAppMenu)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-md px-2 py-1"
              title="Send to N2 Digital HQ via WhatsApp"
              aria-expanded={showWhatsAppMenu}
              aria-haspopup="true"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Send to HQ</span>
              <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${showWhatsAppMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {showWhatsAppMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30 bg-transparent" 
                  onClick={() => setShowWhatsAppMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Select HQ Team
                  </div>
                  <button
                    onClick={() => handleWhatsAppShare('351912281028')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 hover:text-green-700 transition-colors"
                  >
                    <span className="text-base">🇵🇹</span> Portugal
                  </button>
                  <button
                    onClick={() => handleWhatsAppShare('5517982252250')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 hover:text-green-700 transition-colors"
                  >
                    <span className="text-base">🇧🇷</span> Brazil
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true"></div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
            title="Export to CSV"
            aria-label="Export results to CSV file"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          
          <div className="h-4 w-px bg-slate-300 mx-1" aria-hidden="true"></div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
            title="Copy Analysis"
            aria-label={copied ? "Analysis copied to clipboard" : "Copy analysis to clipboard"}
          >
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto" aria-live="polite">
        <article className="prose prose-slate prose-headings:text-slate-800 prose-a:text-indigo-600 max-w-none prose-p:my-6 prose-p:leading-relaxed">
          <ReactMarkdown>{result}</ReactMarkdown>
        </article>
        {renderGroundingChunks()}
        {renderSelfAuditCTA()}
      </div>
    </div>
  );
};

export default AnalysisResult;
