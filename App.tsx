import React, { useState, useCallback, useEffect } from 'react';
import { generateModelIdeas, generateFrontViewVariations, generateOtherViews, getFrontViewPrompt, extractKeywordsFromIdeas } from './services/geminiService';
import type { ModelView, SavedModel, GeneratedModel } from './types';
import { MODEL_VIEWS } from './types';
import ImageView from './components/ImageView';
import Spinner from './components/Spinner';
import Gallery from './components/Gallery';
import Visualizer from './components/Visualizer';
import Inspiration from './components/Inspiration';
import IdeaCard from './components/IdeaCard';
import VariationCard from './components/VariationCard';

const DEFAULT_KEYWORDS = [
  'airsoft', 'alien', 'anime', 'apple watch', 'aquarium', 'articulated', 'axolotl', 'batman', 'benchy', 'beyblade', 
  'birthday', 'bmw', 'bluey', 'bust', 'camping', 'candy dispenser', 'car', 'cat', 'chaveiro', 'chess', 'christmas', 
  'clicker', 'cyberbrick', 'deadpool', 'demon hunters', 'demon slayer', 'dice tower', 'dino', 'dinosaur', 'disney', 
  'dji', 'dog', 'drache', 'dragon', 'drone', 'duck', 'dummy 13', 'earrings', 'engine', 'f1', 'fallout', 'fan art', 
  'fidget', 'figure', 'flexi', 'football', 'fortnite', 'gengar', 'ghost', 'glock', 'golf', 'groot', 'gun', 
  'halloween', 'harry potter', 'helmet', 'hollow knight', 'horse', 'hot wheels', 'hueforge', 'ikea', 'iron man', 
  'jeep', 'katana', 'keychain', 'kit card', 'knitted', 'kpop', 'kürbis', 'labubu', 'lego', 'low-poly', 'magsafe', 
  'makita', 'mandalorian', 'mario', 'mask', 'minecraft', 'miniature', 'moon', 'mouse', 'mushroom', 'naruto', 
  'nintendo switch', 'octopus', 'one piece', 'panda', 'plane', 'pokeball', 'pokemon', 'porsche', 'ps5', 'puzzle', 
  'robot', 'roblox', 'rocket', 'rose', 'scraper', 'sculpture', 'skull', 'snoopy', 'spiderman', 'star wars', 
  'stich', 'sword', 'tank', 'tealight', 'tesla', 'toy', 'transformers', 'vase', 'wall art', 'warhammer', 'weihnachten'
];

const App: React.FC = () => {
  const [page, setPage] = useState<'generator' | 'gallery' | 'visualizer' | 'inspiration'>('generator');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [sessionIdeas, setSessionIdeas] = useState<string[]>([]);
  const [generatedModels, setGeneratedModels] = useState<Record<string, GeneratedModel>>({});
  const [frontViewVariations, setFrontViewVariations] = useState<Record<string, string[]>>({});
  
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<Record<string, boolean>>({});
  const [isGeneratingSideViews, setIsGeneratingSideViews] = useState<Record<string, boolean>>({});

  const [error, setError] = useState<string | null>(null);

  const [focusedKeywords, setFocusedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState<boolean>(false);

  const [savedModels, setSavedModels] = useState<SavedModel[]>(() => {
    try {
      const saved = localStorage.getItem('saved3DModels');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load saved models from localStorage", e);
      return [];
    }
  });

  const [inspirationImage, setInspirationImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('inspirationImage');
    } catch (e) {
      console.error("Failed to load inspiration image from localStorage", e);
      return null;
    }
  });

  const [inspirationKeywords, setInspirationKeywords] = useState<string[]>(() => {
    try {
        const savedKeywords = localStorage.getItem('inspirationKeywords');
        return savedKeywords ? JSON.parse(savedKeywords) : DEFAULT_KEYWORDS;
    } catch (e) {
        console.error("Failed to load keywords from localStorage", e);
        return DEFAULT_KEYWORDS;
    }
  });

  const [excludedKeywords, setExcludedKeywords] = useState<string[]>(() => {
    try {
        const savedKeywords = localStorage.getItem('excludedKeywords');
        return savedKeywords ? JSON.parse(savedKeywords) : [];
    } catch (e) {
        console.error("Failed to load excluded keywords from localStorage", e);
        return [];
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('saved3DModels', JSON.stringify(savedModels));
    } catch (e) {
        console.error("Failed to save models to localStorage", e);
    }
  }, [savedModels]);

  useEffect(() => {
    try {
        localStorage.setItem('inspirationKeywords', JSON.stringify(inspirationKeywords));
    } catch (e) {
        console.error("Failed to save keywords to localStorage", e);
    }
  }, [inspirationKeywords]);

  useEffect(() => {
    try {
        localStorage.setItem('excludedKeywords', JSON.stringify(excludedKeywords));
    } catch (e) {
        console.error("Failed to save excluded keywords to localStorage", e);
    }
    }, [excludedKeywords]);

  useEffect(() => {
    try {
        if (inspirationImage) {
            localStorage.setItem('inspirationImage', inspirationImage);
        } else {
            localStorage.removeItem('inspirationImage');
        }
    } catch (e) {
        console.error("Failed to save inspiration image to localStorage", e);
    }
  }, [inspirationImage]);

  const handleSetInspirationImage = (image: string | null) => {
    setInspirationImage(image);
  };

  const handleAddKeyword = (keyword: string) => {
    const processedKeyword = keyword.trim().toLowerCase();
    if (!processedKeyword) return;
    setInspirationKeywords(prev => [...new Set([...prev, processedKeyword])]);
    setExcludedKeywords(prev => prev.filter(k => k !== processedKeyword));
  };

  const handleAddKeywords = (keywordsToAdd: string[]) => {
    const processedKeywords = keywordsToAdd.map(k => k.trim().toLowerCase()).filter(Boolean);
    const newKeywords = [...new Set([...inspirationKeywords, ...processedKeywords])];
    setInspirationKeywords(newKeywords);
    setExcludedKeywords(prev => prev.filter(k => !processedKeywords.includes(k)));
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setInspirationKeywords(prev => prev.filter(k => k !== keywordToRemove));
    setFocusedKeywords(prev => prev.filter(k => k !== keywordToRemove));
  };

  const handleAddExcludedKeyword = (keyword: string) => {
    const processedKeyword = keyword.trim().toLowerCase();
    if (!processedKeyword) return;
    setExcludedKeywords(prev => [...new Set([...prev, processedKeyword])]);
    setInspirationKeywords(prev => prev.filter(k => k !== processedKeyword));
    setFocusedKeywords(prev => prev.filter(k => k !== processedKeyword));
  };
  
  const handleRemoveExcludedKeyword = (keywordToRemove: string) => {
    setExcludedKeywords(prev => prev.filter(k => k !== keywordToRemove));
  };

  const handleAddKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddKeyword(newKeyword);
    setNewKeyword('');
  };

  const resetForNewIdeas = () => {
    setIdeas([]);
    setGeneratedModels({});
    setFrontViewVariations({});
    setIsGeneratingVariations({});
    setIsGeneratingSideViews({});
    setError(null);
    setGeneratedKeywords([]);
  };

  const handleToggleFocusKeyword = (keyword: string) => {
    setFocusedKeywords(prev => 
        prev.includes(keyword)
            ? prev.filter(k => k !== keyword)
            : [...prev, keyword]
    );
  };

  const handleGenerateIdeas = useCallback(async () => {
    setIsGeneratingIdeas(true);
    resetForNewIdeas();
    
    try {
      const newIdeas = await generateModelIdeas(sessionIdeas, inspirationKeywords, inspirationImage, focusedKeywords, excludedKeywords);
      setIdeas(newIdeas);
      setSessionIdeas(prev => [...new Set([...prev, ...newIdeas])]);
      
      setIsExtractingKeywords(true);
      try {
        const keywords = await extractKeywordsFromIdeas(newIdeas);
        setGeneratedKeywords(keywords);
      } catch (keywordError) {
        console.error("Could not extract keywords:", keywordError);
      } finally {
        setIsExtractingKeywords(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [sessionIdeas, inspirationKeywords, inspirationImage, focusedKeywords, excludedKeywords]);

  const handleGenerateFrontViewVariations = useCallback(async (idea: string) => {
    setIsGeneratingVariations(prev => ({ ...prev, [idea]: true }));
    setError(null);

    try {
      const variations = await generateFrontViewVariations(idea);
      setFrontViewVariations(prev => ({...prev, [idea]: variations}));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingVariations(prev => ({ ...prev, [idea]: false }));
    }
  }, []);

  const handleSelectVariationAndGenerateViews = useCallback(async (idea: string, frontViewUrl: string) => {
    if (generatedModels[frontViewUrl] || isGeneratingSideViews[frontViewUrl]) return;

    setIsGeneratingSideViews(prev => ({ ...prev, [frontViewUrl]: true }));
    setError(null);

    try {
        const existingSavedModel = savedModels.find(m => m.id === frontViewUrl);

        setGeneratedModels(prev => ({
            ...prev,
            [frontViewUrl]: {
                idea,
                isSaved: !!existingSavedModel,
                images: { front: frontViewUrl, left: null, right: null, back: null },
            }
        }));

        const onImageGenerated = (view: Exclude<ModelView, 'front'>, url: string) => {
            setGeneratedModels(prev => {
                const currentModel = prev[frontViewUrl];
                if (!currentModel) return prev;
                return {
                    ...prev,
                    [frontViewUrl]: {
                        ...currentModel,
                        images: { ...currentModel.images, [view]: url }
                    }
                };
            });
        };

        await generateOtherViews(frontViewUrl, onImageGenerated);

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setGeneratedModels(prev => {
            const newModels = {...prev};
            delete newModels[frontViewUrl];
            return newModels;
        });
    } finally {
      setIsGeneratingSideViews(prev => ({ ...prev, [frontViewUrl]: false }));
    }
}, [generatedModels, savedModels, isGeneratingSideViews]);
  
  const handleSaveModel = (frontViewUrl: string) => {
    const modelToSave = generatedModels[frontViewUrl];
    if (!modelToSave || modelToSave.isSaved) return;

    const newSavedModel: SavedModel = {
        id: frontViewUrl,
        idea: modelToSave.idea,
        frontViewPrompt: getFrontViewPrompt(modelToSave.idea),
        images: modelToSave.images,
        timestamp: Date.now(),
    };

    setSavedModels(prev => [...prev, newSavedModel]);

    setGeneratedModels(prev => ({
        ...prev,
        [frontViewUrl]: { ...prev[frontViewUrl], isSaved: true }
    }));
  };

  const handleDeleteModel = (idToDelete: string) => {
    setSavedModels(prev => prev.filter(m => m.id !== idToDelete));

    if (generatedModels[idToDelete]) {
        setGeneratedModels(prev => ({
            ...prev,
            [idToDelete]: { ...prev[idToDelete], isSaved: false }
        }));
    }
  };

  const handleDownloadAll = (frontViewUrl: string) => {
    const modelData = generatedModels[frontViewUrl];
    if (!modelData) return;

    const sanitizedIdea = modelData.idea.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    MODEL_VIEWS.forEach(view => {
        const src = modelData.images[view];
        if (src) {
            const link = document.createElement('a');
            link.href = src;
            const extension = src.split(';')[0].split('/')[1] || 'png';
            link.download = `${sanitizedIdea}_${view}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
  };

  const handleExportData = () => {
    try {
        const dataToExport = {
            savedModels,
            inspirationKeywords,
            excludedKeywords,
            inspirationImage,
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '3d-model-generator-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to export data", e);
        setError("An error occurred while exporting your data.");
    }
  };

  const handleImportData = (file: File) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              if (typeof event.target?.result !== 'string') {
                  throw new Error("Failed to read file.");
              }
              const data = JSON.parse(event.target.result);

              if (!data || typeof data !== 'object') {
                  throw new Error("Invalid or corrupted data file.");
              }

              if (window.confirm("Importing this file will overwrite your current saved models and inspiration settings. Are you sure?")) {
                  setSavedModels(data.savedModels || []);
                  setInspirationKeywords(data.inspirationKeywords || DEFAULT_KEYWORDS);
                  setExcludedKeywords(data.excludedKeywords || []);
                  setInspirationImage(data.inspirationImage || null);
              }

          } catch (e) {
              console.error("Failed to import data", e);
              setError(e instanceof Error ? e.message : "An unknown error occurred during import.");
          }
      };
      // FIX: Corrected method name from readText to readAsText.
      reader.readAsText(file);
  };

  const GhostIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.9999 1.5C6.7499 1.5 2.4999 5.75 2.4999 11C2.4999 12.8913 3.12596 14.6734 4.2239 16.113C4.3319 16.257 4.2689 16.467 4.1209 16.541L2.8319 17.27C2.2159 17.639 1.8339 18.301 1.8339 19.014V19.324C1.8339 19.923 2.2279 20.448 2.7699 20.669L4.2519 21.289C4.4309 21.36 4.6299 21.365 4.8259 21.303L7.7499 20.39C8.0199 20.303 8.2499 20.089 8.3499 19.82L9.2639 17.24C9.4039 16.85 9.8149 16.62 10.2379 16.73L10.5549 16.82C10.9999 16.94 11.4999 17 11.9999 17C12.5019 17 13.0019 16.94 13.4469 16.82L13.7639 16.73C14.1849 16.62 14.5949 16.85 14.7359 17.24L15.6499 19.82C15.7499 20.089 15.9799 20.303 16.2499 20.39L19.1739 21.303C19.3699 21.365 19.5689 21.36 19.7479 21.289L21.2299 20.669C21.7719 20.448 22.1659 19.923 22.1659 19.324V19.014C22.1659 18.301 21.7839 17.639 21.1679 17.27L19.8789 16.541C19.7309 16.467 19.6679 16.257 19.7759 16.113C20.8739 14.6734 21.4999 12.8913 21.4999 11C21.4999 5.75 17.2499 1.5 11.9999 1.5ZM8.2499 9.25C8.2499 8.42 8.9199 7.75 9.7499 7.75C10.5799 7.75 11.2499 8.42 11.2499 9.25C11.2499 10.08 10.5799 10.75 9.7499 10.75C8.9199 10.75 8.2499 10.08 8.2499 9.25ZM14.2499 10.75C13.4199 10.75 12.7499 10.08 12.7499 9.25C12.7499 8.42 13.4199 7.75 14.2499 7.75C15.0799 7.75 15.7499 8.42 15.7499 9.25C15.7499 10.08 15.0799 10.75 14.2499 10.75Z" />
    </svg>
  );

  const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
    </svg>
  );

  const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.342 1.374a3.026 3.026 0 01.64 2.288V17.54a3.026 3.026 0 01-.64 2.288c-.512.79-1.375 1.322-2.342 1.374a49.52 49.52 0 01-5.312 0c-.967-.052-1.83-.585-2.342-1.374a3.026 3.026 0 01-.64-2.288V6.733a3.026 3.026 0 01.64-2.288c.512-.79 1.375 1.322 2.342-1.374zM8.25 6.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  );

  const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>
  );

  const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.548 0A48.108 48.108 0 016.25 5.397m12.15-3.007a48.09 48.09 0 01-5.69 0" />
    </svg>
  );
  
  const PinIcon: React.FC<{ className?: string }> = ({ className }) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path fillRule="evenodd" d="M16.5 3.75a.75.75 0 01.75.75v13.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 111.06-1.06l2.47 2.47V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          <path d="M6 5.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM6 8.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM6 11.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
      </svg>
  );

  const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );

  const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
  );

  const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
  }> = ({ onClick, isActive, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
        isActive
          ? 'bg-cyan-600 text-white font-semibold shadow-lg'
          : 'text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      {children}
    </button>
  );

  const renderContent = () => {
    switch (page) {
      case 'gallery':
        return <Gallery savedModels={savedModels} onDeleteModel={handleDeleteModel} />;
      case 'visualizer':
        return <Visualizer />;
      case 'inspiration':
        return <Inspiration 
          inspirationImage={inspirationImage}
          onSetInspirationImage={handleSetInspirationImage}
          onAddKeywords={handleAddKeywords}
          onExportData={handleExportData}
          onImportData={handleImportData}
          excludedKeywords={excludedKeywords}
          onAddExcludedKeyword={handleAddExcludedKeyword}
          onRemoveExcludedKeyword={handleRemoveExcludedKeyword}
        />;
      case 'generator':
      default:
        return (
          <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-200">Generate New Ideas</h2>
                <p className="text-gray-400 mt-1">Optionally add and select keywords to focus the generation, then click the button.</p>
              </div>

              <div className="border-t border-b border-gray-700 py-6 flex flex-col gap-4">
                  <h3 className="text-lg font-semibold text-gray-200">Focus Keywords</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-48 overflow-y-auto">
                      {inspirationKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                              {inspirationKeywords.sort().map(keyword => {
                                  const isFocused = focusedKeywords.includes(keyword);
                                  return (
                                      <div key={keyword} className="relative group">
                                          <button 
                                              onClick={() => handleToggleFocusKeyword(keyword)}
                                              className={`flex items-center gap-2 text-sm font-medium pl-3 pr-8 py-1 rounded-full border transition-all duration-200 ${
                                                  isFocused 
                                                      ? 'bg-cyan-500 text-cyan-900 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20' 
                                                      : 'bg-purple-600/50 text-purple-200 border-purple-500 hover:bg-purple-600/80 hover:border-purple-400'
                                              }`}
                                          >
                                              {isFocused && <PinIcon className="w-4 h-4 transform -rotate-45" />}
                                              {keyword}
                                          </button>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleRemoveKeyword(keyword); }} 
                                              className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                                                  isFocused 
                                                      ? 'text-cyan-800 hover:bg-black/20' 
                                                      : 'text-purple-300 hover:bg-black/30'
                                              }`}
                                              aria-label={`Remove ${keyword}`}
                                          >
                                              <TrashIcon className="w-3 h-3" />
                                          </button>
                                      </div>
                                  )
                              })}
                          </div>
                      ) : (
                          <p className="text-gray-500 text-center flex items-center justify-center h-full">No keywords added yet.</p>
                      )}
                  </div>

                  <form onSubmit={handleAddKeywordSubmit} className="flex gap-2">
                      <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add a new keyword..."
                          className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                          Add
                      </button>
                  </form>
              </div>

              <div className="flex flex-col items-center gap-4">
                  {focusedKeywords.length > 0 && (
                      <div className="w-full p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                          <p className="text-sm text-purple-200 text-center">
                              <span className="font-bold">Focused Generation:</span> Ideas will be based on {' '}
                              {focusedKeywords.map((kw, i) => (
                                <span key={kw} className="italic">
                                    "{kw}"{i < focusedKeywords.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                          </p>
                      </div>
                  )}
                  <button
                      onClick={handleGenerateIdeas}
                      disabled={isGeneratingIdeas}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-3 text-lg"
                  >
                      {isGeneratingIdeas ? <Spinner /> : '✨'}
                      {isGeneratingIdeas ? 'Generating...' : 'Generate Ideas'}
                  </button>
              </div>

              {error && (
                <div className="mt-2 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">An error occurred: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
            </div>

            {(isExtractingKeywords || (ideas.length > 0 && generatedKeywords.length > 0)) && (
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold text-gray-200 mb-2">Keywords from This Batch</h3>
                    <p className="text-gray-400 mb-4 text-sm">Here are some keywords from the ideas generated above. Click any keyword to add it to your main inspiration list for future generations.</p>
                    {isExtractingKeywords ? (
                        <div className="flex flex-wrap gap-2 animate-pulse">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-8 w-28 bg-gray-700 rounded-full"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {generatedKeywords.map(keyword => {
                                const isInInspiration = inspirationKeywords.includes(keyword);
                                const isInExcluded = excludedKeywords.includes(keyword);
                        
                                return (
                                    <div
                                        key={keyword}
                                        className={`flex items-center rounded-full text-sm font-medium border transition-colors duration-200 ${
                                            isInInspiration ? 'bg-emerald-900/50 border-emerald-700 text-emerald-200' :
                                            isInExcluded ? 'bg-red-900/50 border-red-700 text-red-200' :
                                            'bg-gray-700/60 border-gray-600 text-gray-200'
                                        }`}
                                    >
                                        <span className="pl-3 pr-2 py-1">{keyword}</span>
                                        <div className={`flex items-center border-l ${
                                            isInInspiration ? 'border-emerald-700/50' :
                                            isInExcluded ? 'border-red-700/50' :
                                            'border-gray-500'
                                        }`}>
                                            <button
                                                onClick={() => handleAddKeyword(keyword)}
                                                disabled={isInInspiration}
                                                className="p-1.5 text-emerald-300 hover:text-white disabled:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={isInInspiration ? `"${keyword}" is in inspiration list` : `Add "${keyword}" to inspiration list`}
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAddExcludedKeyword(keyword)}
                                                disabled={isInExcluded}
                                                className="p-1.5 text-red-400 hover:text-white disabled:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={isInExcluded ? `"${keyword}" is excluded` : `Exclude "${keyword}"`}
                                            >
                                                <MinusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        
            {isGeneratingIdeas && (
              <div className="flex flex-row gap-6 overflow-x-auto py-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 animate-pulse w-72 h-48 flex-shrink-0 flex flex-col gap-4">
                    <div className="flex-grow bg-gray-700/50 rounded-lg"></div>
                    <div className="h-10 bg-gray-700/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
        
            {ideas.length > 0 && (
              <div className="flex flex-row gap-6 overflow-x-auto py-2">
                {ideas.map(idea => (
                  <IdeaCard
                    key={idea}
                    idea={idea}
                    onVisualize={() => handleGenerateFrontViewVariations(idea)}
                    isVisualizing={!!isGeneratingVariations[idea]}
                    isSelected={!!frontViewVariations[idea]}
                  />
                ))}
              </div>
            )}

            {Object.entries(frontViewVariations).map(([idea, variations]) => (
                <div key={idea} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mt-8">
                  <h3 className="text-xl font-bold mb-1 text-gray-200">Choose a Front View for <span className="italic text-gray-300">"{idea}"</span></h3>
                  <p className="text-gray-400 mb-4">Select one of the generated concepts to create the other viewing angles.</p>
                  <div className="flex flex-row gap-6 overflow-x-auto py-2">
                    {variations.map((src) => (
                      <VariationCard
                        key={src}
                        src={src}
                        onSelect={() => handleSelectVariationAndGenerateViews(idea, src)}
                        isLoading={!!isGeneratingSideViews[src]}
                        isGenerated={!!generatedModels[src]}
                      />
                    ))}
                  </div>
                </div>
            ))}
        
            {Object.values(generatedModels).filter(m => (m as GeneratedModel).images.front).length > 0 && (
              <div className="flex flex-col gap-8">
                {Object.entries(generatedModels).map(([frontViewUrl, model]) => (
                  <div key={frontViewUrl} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-1 text-gray-200">Generated Views</h3>
                    <p className="text-gray-400 mb-4">All angles for <span className="italic text-gray-300">"{(model as GeneratedModel).idea}"</span> have been generated.</p>
            
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {MODEL_VIEWS.map(view => (
                        <ImageView
                          key={view}
                          src={(model as GeneratedModel).images[view]}
                          label={view}
                          isLoading={!(model as GeneratedModel).images[view]}
                          idea={(model as GeneratedModel).idea}
                        />
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                      <button
                        onClick={() => handleDownloadAll(frontViewUrl)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Download All
                      </button>
                      <button
                        onClick={() => handleSaveModel(frontViewUrl)}
                        disabled={(model as GeneratedModel).isSaved}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        {(model as GeneratedModel).isSaved ? 'Saved to Gallery' : 'Save to Gallery'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-8">
        <main className="max-w-7xl mx-auto flex flex-col gap-8">
            <header className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <GhostIcon className="w-12 h-12 text-cyan-300"/>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight">3D Model Idea Generator</h1>
                </div>
                 <p className="text-gray-400 max-w-3xl">
                    Generate unique, non-functional 3D model ideas with AI. Visualize them from multiple angles, then save your favorites to your gallery. Use the visualizer to create photorealistic renders of your own models.
                </p>
                <nav className="flex flex-wrap gap-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700 self-start">
                    <NavButton onClick={() => setPage('generator')} isActive={page === 'generator'}>
                        <LightbulbIcon className="w-5 h-5" />
                        Idea Generator
                    </NavButton>
                    <NavButton onClick={() => setPage('visualizer')} isActive={page === 'visualizer'}>
                        <CameraIcon className="w-5 h-5"/>
                        Photorealistic Visualizer
                    </NavButton>
                    <NavButton onClick={() => setPage('gallery')} isActive={page === 'gallery'}>
                        <CollectionIcon className="w-5 h-5" />
                        My Gallery
                    </NavButton>
                    <NavButton onClick={() => setPage('inspiration')} isActive={page === 'inspiration'}>
                        <LightbulbIcon className="w-5 h-5"/>
                        Inspiration Sources
                    </NavButton>
                </nav>
            </header>

            <div className="w-full">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;