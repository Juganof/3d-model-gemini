

import React, { useState, useCallback, useEffect } from 'react';
import { generateModelIdeas, generateFrontViewVariations, generateOtherViews, getFrontViewPrompt } from './services/geminiService';
import type { ModelView, SavedModel, GeneratedModel } from './types';
import { MODEL_VIEWS } from './types';
import ImageView from './components/ImageView';
import Spinner from './components/Spinner';
import VariationCard from './components/VariationCard';
import Gallery from './components/Gallery';

const App: React.FC = () => {
  const [page, setPage] = useState<'generator' | 'gallery'>('generator');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [sessionIdeas, setSessionIdeas] = useState<string[]>([]);
  const [frontViewVariations, setFrontViewVariations] = useState<Record<string, string[]>>({});
  const [generatedModels, setGeneratedModels] = useState<Record<string, GeneratedModel>>({});
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<Record<string, boolean>>({});
  const [generatingStatus, setGeneratingStatus] = useState<Record<string, boolean>>({});

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('saved3DModels');
        if (saved) {
            const parsedModels: SavedModel[] = JSON.parse(saved);
            setSavedModels(parsedModels);
        }
    } catch (e) {
        console.error("Failed to load saved models from localStorage", e);
        setSavedModels([]);
    }
  }, []);

  const resetForNewIdeas = () => {
    setIdeas([]);
    setFrontViewVariations({});
    setGeneratedModels({});
    setIsGeneratingVariations({});
    setGeneratingStatus({});
    setError(null);
  };

  const handleGenerateIdeas = useCallback(async () => {
    setIsGeneratingIdeas(true);
    resetForNewIdeas();
    
    try {
      const newIdeas = await generateModelIdeas(sessionIdeas);
      setIdeas(newIdeas);
      setSessionIdeas(prev => [...new Set([...prev, ...newIdeas])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [sessionIdeas]);

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

    const updatedSavedModels = [...savedModels, newSavedModel];
    setSavedModels(updatedSavedModels);
    localStorage.setItem('saved3DModels', JSON.stringify(updatedSavedModels));

    setGeneratedModels(prev => ({
        ...prev,
        [frontViewUrl]: { ...prev[frontViewUrl], isSaved: true }
    }));
  };

  const handleDeleteModel = (idToDelete: string) => {
    const updatedSavedModels = savedModels.filter(m => m.id !== idToDelete);
    setSavedModels(updatedSavedModels);
    localStorage.setItem('saved3DModels', JSON.stringify(updatedSavedModels));

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

  const GhostIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.9999 1.5C6.7499 1.5 2.4999 5.75 2.4999 11C2.4999 12.8913 3.12596 14.6734 4.2239 16.113C4.3319 16.257 4.2689 16.467 4.1209 16.541L2.8319 17.27C2.2159 17.639 1.8339 18.301 1.8339 19.014V19.324C1.8339 19.923 2.2279 20.448 2.7699 20.669L4.2519 21.289C4.4309 21.36 4.6299 21.365 4.8259 21.303L7.7499 20.39C8.0199 20.303 8.2499 20.089 8.3499 19.82L9.2639 17.24C9.4039 16.85 9.8149 16.62 10.2379 16.73L10.5549 16.82C10.9999 16.94 11.4999 17 11.9999 17C12.5019 17 13.0019 16.94 13.4469 16.82L13.7639 16.73C14.1849 16.62 14.5949 16.85 14.7359 17.24L15.6499 19.82C15.7499 20.089 15.9799 20.303 16.2499 20.39L19.1739 21.303C19.3699 21.365 19.5689 21.36 19.7479 21.289L21.2299 20.669C21.7719 20.448 22.1659 19.923 22.1659 19.324V19.014C22.1659 18.301 21.7839 17.639 21.1679 17.27L19.8789 16.541C19.7309 16.467 19.6679 16.257 19.7759 16.113C20.8739 14.6734 21.4999 12.8913 21.4999 11C21.4999 5.75 17.2499 1.5 11.9999 1.5ZM8.2499 9.25C8.2499 8.42 8.9199 7.75 9.7499 7.75C10.5799 7.75 11.2499 8.42 11.2499 9.25C11.2499 10.08 10.5799 10.75 9.7499 10.75C8.9199 10.75 8.2499 10.08 8.2499 9.25ZM14.2499 10.75C13.4199 10.75 12.7499 10.08 12.7499 9.25C12.7499 8.42 13.4199 7.75 14.2499 7.75C15.0799 7.75 15.7499 8.42 15.7499 9.25C15.7499 10.08 15.0799 10.75 14.2499 10.75Z" />
    </svg>
  );

  const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-3.833 2.067-7.17 5.138-8.962a.75.75 0 01.82.162z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 2.25zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM19.94 11.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM18.894 17.894a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM12 19.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 19.5zM5.106 17.894a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM4.06 12.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.106 6.106a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );

  const StepNumber: React.FC<{ num: number; text: string; }> = ({ num, text }) => (
    <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-lg border-2 border-purple-400">
            {num}
        </div>
        <h2 className="text-2xl font-bold text-gray-200">{text}</h2>
    </div>
  );

  const renderContent = () => {
    if (page === 'gallery') {
      return <Gallery savedModels={savedModels} onDeleteModel={handleDeleteModel} />;
    }

    return (
      <>
        {/* Step 1: Generate Ideas */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
          <StepNumber num={1} text="Generate Model Ideas" />
          <p className="mt-3 mb-5 text-gray-400 pl-14">Start by generating a list of creative, non-functional 3D model ideas. The AI will provide four diverse options to choose from.</p>
          <div className="pl-14">
            <button
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {isGeneratingIdeas ? <Spinner /> : <LightbulbIcon className="w-6 h-6" />}
              {isGeneratingIdeas ? 'Generating...' : 'Generate New Ideas'}
            </button>
          </div>
        </div>

        {/* Ideas List */}
        {ideas.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ideas.map((idea, index) => (
                    <div key={index} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center text-center gap-4">
                        <p className="text-lg text-gray-200 flex-grow">"{idea}"</p>
                        <button
                            onClick={() => handleVisualizeIdea(idea)}
                            disabled={isGeneratingVariations[idea]}
                            className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            {isGeneratingVariations[idea] && <Spinner className="w-5 h-5"/>}
                            Visualize This Idea
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Step 2 & 3: Visualize and Generate */}
        {Object.keys(frontViewVariations).map(idea => (
          <div key={idea} className="mt-8 pt-8 border-t-2 border-dashed border-gray-700">
             <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                <StepNumber num={2} text="Select Front View" />
                <p className="mt-3 mb-5 text-gray-400 pl-14">The AI has generated four variations for "<span className="font-semibold text-cyan-300">{idea}</span>". Choose the one you like best to generate the other angles.</p>
                {isGeneratingVariations[idea] && frontViewVariations[idea].length === 0 && (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-12 h-12 text-cyan-400" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {frontViewVariations[idea].map((src, index) => (
                    <VariationCard
                      key={index}
                      src={src}
                      onSelect={() => handleGenerateAllViews(src, idea)}
                      isLoading={generatingStatus[src]}
                      isGenerated={!!generatedModels[src]}
                    />
                  ))}
                </div>

                {Object.keys(generatedModels).filter(url => frontViewVariations[idea].includes(url)).map(frontViewUrl => (
                  <div key={frontViewUrl} className="mt-8 pt-6 border-t-2 border-dashed border-gray-700">
                    <StepNumber num={3} text="Generate All Views" />
                    <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {MODEL_VIEWS.map(view => (
                        <ImageView
                          key={view}
                          src={generatedModels[frontViewUrl].images[view]}
                          label={view}
                          isLoading={generatingStatus[frontViewUrl] && !generatedModels[frontViewUrl].images[view]}
                          idea={generatedModels[frontViewUrl].idea}
                        />
                      ))}
                    </div>
                    {generatedModels[frontViewUrl].images.back && !generatingStatus[frontViewUrl] && (
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => handleDownloadAll(frontViewUrl)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                Download All Images
                            </button>
                            <button
                                onClick={() => handleSaveModel(frontViewUrl)}
                                disabled={generatedModels[frontViewUrl].isSaved}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                {generatedModels[frontViewUrl].isSaved ? 'Saved to Gallery' : 'Save to Gallery'}
                            </button>
                        </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">An error occurred: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-4">
            <GhostIcon className="w-16 h-16 text-purple-400"/>
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    3D Model Idea Generator
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    From abstract concepts to visual renders with AI
                </p>
            </div>
          </div>
        </header>

        <div className="flex justify-center mb-8">
            <div className="bg-gray-800 rounded-full p-1 border border-gray-700">
                <button 
                    onClick={() => setPage('generator')}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${page === 'generator' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Generator
                </button>
                <button 
                    onClick={() => setPage('gallery')}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${page === 'gallery' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Gallery {savedModels.length > 0 && `(${savedModels.length})`}
                </button>
            </div>
        </div>

        <main className="flex flex-col gap-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;