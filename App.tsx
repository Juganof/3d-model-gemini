
import React, { useState, useCallback, useEffect } from 'react';
import { generateModelIdeas, generateFrontViewVariations, generateOtherViews, getFrontViewPrompt } from './services/geminiService';
import type { ModelView, SavedModel, GeneratedModel } from './types';
import { MODEL_VIEWS } from './types';
import ImageView from './components/ImageView';
import Spinner from './components/Spinner';
import VariationCard from './components/VariationCard';
import Gallery from './components/Gallery';
import Visualizer from './components/Visualizer';
import Inspiration from './components/Inspiration';
import IdeaCard from './components/IdeaCard';

const DEFAULT_KEYWORDS = [
  "halloween", "fidget", "dragon", "pokemon", "ghost", "skull", "dino", "groot", "spiderman", "batman", "star wars",
  "harry potter", "minecraft", "hollow knight", "cat", "axolotl", "octopus", "spider", "articulated", "flexi",
  "low-poly", "vase", "planter", "organizer", "container", "stand", "holder", "wall art", "sculpture", "miniature",
  "robot", "rocket", "car", "sword", "dice tower"
];

const App: React.FC = () => {
  const [page, setPage] = useState<'generator' | 'gallery' | 'visualizer' | 'inspiration'>('generator');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [sessionIdeas, setSessionIdeas] = useState<string[]>([]);
  const [frontViewVariations, setFrontViewVariations] = useState<Record<string, string[]>>({});
  const [generatedModels, setGeneratedModels] = useState<Record<string, GeneratedModel>>({});
  
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<Record<string, boolean>>({});
  const [generatingStatus, setGeneratingStatus] = useState<Record<string, boolean>>({});

  const [error, setError] = useState<string | null>(null);

  const [focusedKeywords, setFocusedKeywords] = useState<string[]>([]);
  
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
    const newKeywords = [...new Set([...inspirationKeywords, processedKeyword])];
    setInspirationKeywords(newKeywords);
  };

  const handleAddKeywords = (keywordsToAdd: string[]) => {
    const processedKeywords = keywordsToAdd.map(k => k.trim().toLowerCase()).filter(Boolean);
    const newKeywords = [...new Set([...inspirationKeywords, ...processedKeywords])];
    setInspirationKeywords(newKeywords);
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const newKeywords = inspirationKeywords.filter(k => k !== keywordToRemove);
    setInspirationKeywords(newKeywords);
  };

  const resetForNewIdeas = () => {
    setIdeas([]);
    setFrontViewVariations({});
    setGeneratedModels({});
    setIsGeneratingVariations({});
    setGeneratingStatus({});
    setError(null);
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
      const newIdeas = await generateModelIdeas(sessionIdeas, inspirationKeywords, inspirationImage, focusedKeywords);
      setIdeas(newIdeas);
      setSessionIdeas(prev => [...new Set([...prev, ...newIdeas])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [sessionIdeas, inspirationKeywords, inspirationImage, focusedKeywords]);

  const handleVisualizeIdea = useCallback(async (idea: string) => {
    setIsGeneratingVariations(prev => ({ ...prev, [idea]: true }));
    setError(null);
    setFrontViewVariations(prev => ({ ...prev, [idea]: [] }));
    
    try {
      const variations = await generateFrontViewVariations(idea);
      setFrontViewVariations(prev => ({ ...prev, [idea]: variations }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setFrontViewVariations(prev => {
          const newState = {...prev};
          delete newState[idea];
          return newState;
      });
    } finally {
      setIsGeneratingVariations(prev => ({ ...prev, [idea]: false }));
    }
  }, []);

  const handleGenerateAllViews = useCallback(async (frontViewUrl: string, idea: string) => {
    if (generatingStatus[frontViewUrl] || generatedModels[frontViewUrl]?.images.back) {
        return;
    }
    setError(null);
    setGeneratingStatus(prev => ({ ...prev, [frontViewUrl]: true }));

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

    try {
      await generateOtherViews(frontViewUrl, onImageGenerated);
    } catch (err) {
       setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
       setGeneratedModels(prev => {
           const newModels = { ...prev };
           delete newModels[frontViewUrl];
           return newModels;
       });
    } finally {
      setGeneratingStatus(prev => ({ ...prev, [frontViewUrl]: false }));
    }
  }, [generatingStatus, generatedModels, savedModels]);
  
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

              if (!data || typeof data !== 'object' || !('savedModels' in data) || !('inspirationKeywords' in data)) {
                  throw new Error("Invalid or corrupted data file.");
              }

              if (window.confirm("Importing this file will overwrite your current saved models and inspiration settings. Are you sure?")) {
                  setSavedModels(data.savedModels || []);
                  setInspirationKeywords(data.inspirationKeywords || DEFAULT_KEYWORDS);
                  setInspirationImage(data.inspirationImage || null);
              }

          } catch (e) {
              console.error("Failed to import data", e);
              setError(e instanceof Error ? e.message : "An unknown error occurred during import.");
          }
      };
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
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.342 1.374a3.026 3.026 0 01.64 2.288V17.54a3.026 3.026 0 01-.64 2.288c-.512.79-1.375 1.322-2.342 1.374a49.52 49.52 0 01-5.312 0c-.967-.052-1.83-.585-2.342-1.374a3.026 3.026 0 01-.64-2.288V6.733a3.026 3.026 0 01.64-2.288c.512.79 1.375 1.322 2.342-1.374zM8.25 6.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  );

  const CollectionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
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
          inspirationKeywords={inspirationKeywords}
          onAddKeyword={handleAddKeyword}
          onAddKeywords={handleAddKeywords}
          onRemoveKeyword={handleRemoveKeyword}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />;
      case 'generator':
      default:
        return (
          <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-200">Generate New Ideas</h2>
                  <p className="text-gray-400 mt-1">Click the button to generate four unique ideas for 3D models.</p>
                </div>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={isGeneratingIdeas}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-3 text-lg"
                >
                  {isGeneratingIdeas ? <Spinner /> : '✨'}
                  {isGeneratingIdeas ? 'Generating...' : 'Generate Ideas'}
                </button>
              </div>
        
              {focusedKeywords.length > 0 && (
                  <div className="mt-4 p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                      <p className="text-sm text-purple-200">
                          <span className="font-bold">Focused Generation:</span> Ideas will be based on the keywords: {focusedKeywords.join(', ')}.
                      </p>
                  </div>
              )}
        
              {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                  <strong className="font-bold">An error occurred: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
            </div>
        
            {isGeneratingIdeas && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 animate-pulse">
                    <div className="h-24 bg-gray-700/50 rounded-lg mb-4"></div>
                    <div className="h-8 bg-gray-700/50 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
        
            {ideas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ideas.map(idea => (
                  <IdeaCard
                    key={idea}
                    idea={idea}
                    onVisualize={() => handleVisualizeIdea(idea)}
                    isVisualizing={!!isGeneratingVariations[idea]}
                  />
                ))}
              </div>
            )}
        
            {/* FIX: Cast `variations` to `string[]` to access `.length` because TypeScript inference for Object.entries can be too broad. */}
            {Object.entries(frontViewVariations).map(([idea, variations]) => (variations as string[]).length > 0 && (
              <div key={idea} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold mb-1 text-gray-200">Step 2: Choose a Front View</h3>
                <p className="text-gray-400 mb-4">Select the best front view for: <span className="italic text-gray-300">"{idea}"</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* FIX: Cast `variations` to `string[]` to access `.map`. */}
                  {(variations as string[]).map((src, i) => (
                    <VariationCard
                      key={`${idea}-variation-${i}`}
                      src={src}
                      onSelect={() => handleGenerateAllViews(src, idea)}
                      isLoading={!!generatingStatus[src]}
                      isGenerated={!!generatedModels[src]?.images.back}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* FIX: Cast `m` to `GeneratedModel` to access `.images` because TypeScript inference for Object.values can be too broad. */}
            {Object.values(generatedModels).filter(m => (m as GeneratedModel).images.front).length > 0 && (
              <div className="flex flex-col gap-8">
                {Object.entries(generatedModels).map(([frontViewUrl, model]) => (
                  <div key={frontViewUrl} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-1 text-gray-200">Step 3: All Views Generated</h3>
                    {/* FIX: Cast `model` to `GeneratedModel` to access `.idea`. */}
                    <p className="text-gray-400 mb-4">All angles for <span className="italic text-gray-300">"{(model as GeneratedModel).idea}"</span> have been generated.</p>
            
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {MODEL_VIEWS.map(view => (
                        <ImageView
                          key={view}
                          // FIX: Cast `model` to `GeneratedModel` to access `.images`.
                          src={(model as GeneratedModel).images[view]}
                          label={view}
                          // FIX: Cast `model` to `GeneratedModel` to access `.images`.
                          isLoading={!(model as GeneratedModel).images[view]}
                          // FIX: Cast `model` to `GeneratedModel` to access `.idea`.
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
                        // FIX: Cast `model` to `GeneratedModel` to access `.isSaved`.
                        disabled={(model as GeneratedModel).isSaved}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        {/* FIX: Cast `model` to `GeneratedModel` to access `.isSaved`. */}
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
