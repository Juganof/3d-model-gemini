


import React, { useState, useCallback, useEffect } from 'react';
import { generateSceneDescription, generateRealisticView, generateMakerWorldContent } from '../services/geminiService';
import ImageUploadSlot from './ImageUploadSlot';
import ImageView from './ImageView';
import Spinner from './Spinner';

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.342 1.374a3.026 3.026 0 01.64 2.288V17.54a3.026 3.026 0 01-.64 2.288c-.512.79-1.375 1.322-2.342 1.374a49.52 49.52 0 01-5.312 0c-.967-.052-1.83-.585-2.342-1.374a3.026 3.026 0 01-.64-2.288V6.733a3.026 3.026 0 01.64-2.288c.512-.79 1.375 1.322 2.342-1.374zM8.25 6.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.548 0A48.108 48.108 0 016.25 5.397m12.15-3.007a48.09 48.09 0 01-5.69 0" />
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const PencilSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V5.25c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V7.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const ReRenderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v4.992h-4.992m0 0L9.18 7.964a8.25 8.25 0 0111.664 0l3.181 3.183" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);


const TextContentSkeleton = () => (
    <div className="mt-6 flex flex-col gap-6 animate-pulse" aria-label="Generating text content...">
      {/* Title Skeleton */}
      <div>
        <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-14 bg-gray-900/70 border border-gray-600 rounded-lg flex items-center p-4">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
      {/* Description Skeleton */}
      <div>
        <div className="h-5 bg-gray-700 rounded w-48 mb-2"></div>
        <div className="h-28 bg-gray-900/70 border border-gray-600 rounded-lg p-4 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
      {/* Tags Skeleton */}
      <div>
        <div className="h-5 bg-gray-700 rounded w-36 mb-2"></div>
        <div className="p-4 bg-gray-900/70 border border-gray-600 rounded-lg flex flex-col gap-2">
          <div className="h-9 bg-gray-800/50 rounded-md"></div>
          <div className="h-9 bg-gray-800/50 rounded-md"></div>
          <div className="h-9 bg-gray-800/50 rounded-md"></div>
          <div className="h-9 bg-gray-800/50 rounded-md"></div>
        </div>
      </div>
    </div>
);

interface VisualizerImage {
  id: string;
  slicerImage: string | null;
  realisticImage: string | null;
}

const Visualizer: React.FC = () => {
    const [images, setImages] = useState<VisualizerImage[]>([]);
    const [sceneDescription, setSceneDescription] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [reRenderingId, setReRenderingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showLayerLines, setShowLayerLines] = useState(true);
    const [colorOption, setColorOption] = useState<'single' | 'multi'>('single');
    const [makerWorldContent, setMakerWorldContent] = useState<{ title: string; description: string; tags: string[] } | null>(null);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [copiedTitle, setCopiedTitle] = useState(false);
    const [copiedDescription, setCopiedDescription] = useState(false);
    const [copiedTags, setCopiedTags] = useState<string[]>([]);

    const slicerImageUrls = images.map(img => img.slicerImage).join(',');
    
    useEffect(() => {
        // This effect runs when an image is added, removed, cleared, or when color option changes.
        // By resetting the scene description, we ensure it gets regenerated
        // with the updated set of images and settings on the next "Generate" click.
        setSceneDescription(null);
    }, [slicerImageUrls, colorOption]);

    useEffect(() => {
        if (images.length === 0) {
            addNewSlot();
        }
    }, [images.length]);

    const addNewSlot = () => {
        setImages(prev => [...prev, { id: crypto.randomUUID(), slicerImage: null, realisticImage: null }]);
    };

    const handleImageUpload = (id: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setImages(prev => prev.map(img => img.id === id ? { ...img, slicerImage: reader.result as string, realisticImage: null } : img));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleBatchUpload = useCallback((files: FileList) => {
        if (!files || files.length === 0) return;
    
        const fileReadPromises = Array.from(files).map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Failed to read file as data URL.'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
    
        Promise.all(fileReadPromises).then(dataUrls => {
            const newImages = dataUrls.map(url => ({
                id: crypto.randomUUID(),
                slicerImage: url,
                realisticImage: null
            }));
            
            setImages(prevImages => {
                const existingImages = prevImages.filter(img => img.slicerImage !== null);
                return [...existingImages, ...newImages];
            });
        }).catch(err => {
            console.error("Error during batch upload file reading:", err);
            setError("An error occurred while reading the uploaded files. Please ensure they are valid image files and try again.");
        });
    }, []);

    const handleImageClear = (id: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, slicerImage: null, realisticImage: null } : img));
    };
    
    const handleSlotRemove = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const imagesToGenerateCount = images.filter(img => img.slicerImage && !img.realisticImage).length;
    
    const handleGenerate = useCallback(async () => {
        if (imagesToGenerateCount === 0) return;

        setIsLoading(true);
        setError(null);
        
        try {
            let currentSceneDescription = sceneDescription;
            if (!currentSceneDescription) {
                setLoadingStatus("Generating scene description...");
                const slicerImagesForScene: Record<string, string> = {};
                images.forEach((img, index) => {
                    if (img.slicerImage) {
                        slicerImagesForScene[`image_${index}`] = img.slicerImage;
                    }
                });
                
                if (Object.keys(slicerImagesForScene).length === 0) {
                    throw new Error("No slicer images uploaded to create a scene.");
                }
                
                currentSceneDescription = await generateSceneDescription(slicerImagesForScene, colorOption);
                setSceneDescription(currentSceneDescription);
            }
            
            setLoadingStatus(`Generating ${imagesToGenerateCount} new view(s)...`);

            const imagesToGenerate = images.filter(img => img.slicerImage && !img.realisticImage);
            
            await Promise.all(imagesToGenerate.map(async (image) => {
                const angleIndex = images.findIndex(img => img.id === image.id);
                const realisticImage = await generateRealisticView(image.slicerImage!, currentSceneDescription!, `angle ${angleIndex + 1}`, showLayerLines);
                setImages(prev => prev.map(img => img.id === image.id ? { ...img, realisticImage } : img));
            }));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingStatus(null);
        }
    }, [images, sceneDescription, imagesToGenerateCount, colorOption, showLayerLines]);

    const handleReRender = useCallback(async (id: string) => {
        const imageToRender = images.find(img => img.id === id);
        if (!imageToRender || !imageToRender.slicerImage) return;
    
        setReRenderingId(id);
        setError(null);
    
        try {
            let currentSceneDescription = sceneDescription;
            // Always regenerate scene description on re-render in case settings changed
            setLoadingStatus("Generating scene description...");
            const slicerImagesForScene: Record<string, string> = {};
            images.forEach((img, index) => {
                if (img.slicerImage) slicerImagesForScene[`image_${index}`] = img.slicerImage;
            });
            if (Object.keys(slicerImagesForScene).length === 0) throw new Error("No images uploaded to create a scene.");

            currentSceneDescription = await generateSceneDescription(slicerImagesForScene, colorOption);
            setSceneDescription(currentSceneDescription);
    
            const angleIndex = images.findIndex(img => img.id === id);
            setLoadingStatus(`Re-rendering Angle ${angleIndex + 1}...`);
            const realisticImage = await generateRealisticView(imageToRender.slicerImage, currentSceneDescription, `angle ${angleIndex + 1}`, showLayerLines);
            setImages(prev => prev.map(img => img.id === id ? { ...img, realisticImage } : img));
    
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setReRenderingId(null);
            setLoadingStatus(null);
        }
    }, [images, sceneDescription, colorOption, showLayerLines]);

    const handleRegenerateAll = useCallback(async () => {
        const imagesToRegenerate = images.filter(img => img.slicerImage);
        if (imagesToRegenerate.length === 0) return;
    
        setIsLoading(true);
        setError(null);
        
        // Clear existing realistic images to show loading state on each card
        setImages(prev => prev.map(img => img.slicerImage ? { ...img, realisticImage: null } : img));
    
        try {
            setLoadingStatus("Generating new scene description...");
            const slicerImagesForScene: Record<string, string> = {};
            imagesToRegenerate.forEach((img, index) => {
                slicerImagesForScene[`image_${index}`] = img.slicerImage!;
            });
    
            const newSceneDescription = await generateSceneDescription(slicerImagesForScene, colorOption);
            setSceneDescription(newSceneDescription);
    
            setLoadingStatus(`Regenerating all ${imagesToRegenerate.length} view(s)...`);
    
            await Promise.all(imagesToRegenerate.map(async (image) => {
                const angleIndex = images.findIndex(img => img.id === image.id);
                const realisticImage = await generateRealisticView(image.slicerImage!, newSceneDescription, `angle ${angleIndex + 1}`, showLayerLines);
                setImages(prev => prev.map(img => img.id === image.id ? { ...img, realisticImage } : img));
            }));
    
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingStatus(null);
        }
    }, [images, colorOption, showLayerLines]);

    const handleGenerateText = useCallback(async () => {
        setIsGeneratingText(true);
        setError(null);
        setMakerWorldContent(null);
        setCopiedTitle(false);
        setCopiedDescription(false);
        setCopiedTags([]);

        try {
            const slicerImagesForText: Record<string, string> = {};
            images.forEach((img, index) => {
                if (img.slicerImage) {
                    slicerImagesForText[`image_${index}`] = img.slicerImage;
                }
            });

            if (Object.keys(slicerImagesForText).length === 0) {
                throw new Error("Upload at least one slicer image to generate text.");
            }

            const result = await generateMakerWorldContent(slicerImagesForText);
            setMakerWorldContent(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGeneratingText(false);
        }
    }, [images]);

    const handleCopy = (text: string, type: 'title' | 'description') => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'title') {
                setCopiedTitle(true);
            } else {
                setCopiedDescription(true);
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setError("Failed to copy text to clipboard.");
        });
    };

    const handleCopyTag = (tag: string) => {
        if (copiedTags.includes(tag)) return;
        navigator.clipboard.writeText(tag).then(() => {
            setCopiedTags(prev => [...prev, tag]);
        }).catch(err => {
            console.error('Failed to copy tag: ', err);
            setError("Failed to copy tag to clipboard.");
        });
    };

    const handleDownloadUploads = useCallback(() => {
        const uploadedImagesExist = images.some(img => img.slicerImage);
        if (!uploadedImagesExist) return;

        images.forEach((image, index) => {
            if (image.slicerImage) {
                const src = image.slicerImage;
                const link = document.createElement('a');
                link.href = src;
                const extension = src.split(';')[0].split('/')[1] || 'png';
                link.download = `uploaded_angle_${index + 1}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }, [images]);


    return (
        <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white font-bold text-lg border-2 border-cyan-400">
                            1
                        </div>
                        <h2 className="text-2xl font-bold text-gray-200">Upload Model Angles & Settings</h2>
                    </div>
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            id="batch-upload-input"
                            multiple
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => e.target.files && handleBatchUpload(e.target.files)}
                            className="hidden"
                        />
                        <label
                            htmlFor="batch-upload-input"
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                            aria-label="Batch upload multiple angle images"
                        >
                            <UploadIcon className="w-5 h-5" />
                            Batch Upload
                        </label>
                        {images.some(img => img.slicerImage) && (
                            <button
                                onClick={handleDownloadUploads}
                                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                                aria-label="Download all uploaded angle images"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download Uploads
                            </button>
                        )}
                    </div>
                </div>
                <p className="mt-3 text-gray-400 pl-14">Upload one or more screenshots of your model from your slicer software, then choose your render settings below.</p>
                
                <div className="pl-14 my-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Render Settings</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                        {/* Color Option */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Color Style</label>
                            <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-600">
                                <button onClick={() => setColorOption('single')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors w-32 ${colorOption === 'single' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>Single Color</button>
                                <button onClick={() => setColorOption('multi')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors w-32 ${colorOption === 'multi' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>Multiple Colors</button>
                            </div>
                        </div>
                        {/* Layer Lines Toggle */}
                        <div className="flex items-center gap-3 sm:pt-7">
                            <button
                                onClick={() => setShowLayerLines(!showLayerLines)}
                                className={`${showLayerLines ? 'bg-cyan-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800`}
                                role="switch"
                                aria-checked={showLayerLines}
                                id="layer-lines-toggle"
                            >
                                <span className={`${showLayerLines ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                            </button>
                            <label htmlFor="layer-lines-toggle" className="text-sm font-medium text-gray-300 cursor-pointer">Show 3D Print Layer Lines</label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={image.id} className="relative group/slot">
                             <ImageUploadSlot
                                key={image.id}
                                label={`Angle ${index + 1}`}
                                image={image.slicerImage}
                                onImageUpload={(file) => handleImageUpload(image.id, file)}
                                onImageClear={() => handleImageClear(image.id)}
                            />
                            {images.length > 1 && (
                                <button
                                    onClick={() => handleSlotRemove(image.id)}
                                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover/slot:opacity-100 transition-opacity duration-200 z-10"
                                    aria-label={`Remove Angle ${index + 1}`}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                     <div className="w-full aspect-square bg-transparent rounded-lg flex items-center justify-center ">
                        <button
                            onClick={addNewSlot}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-cyan-400 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-lg transition-colors duration-200"
                            aria-label="Add another angle"
                        >
                            <PlusIcon className="w-8 h-8"/>
                            <span className="font-semibold">Add Angle</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={imagesToGenerateCount === 0 || isLoading}
                    className="inline-flex items-center gap-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
                >
                    {isLoading ? <Spinner /> : <CameraIcon className="w-6 h-6" />}
                    {isLoading ? (loadingStatus || 'Generating...') : `Generate Visuals for ${imagesToGenerateCount} New ${imagesToGenerateCount === 1 ? 'Angle' : 'Angles'}`}
                </button>
            </div>

            {isLoading && !images.some(img => img.realisticImage) && (
                <div className="flex justify-center items-center flex-col gap-4 text-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                    <Spinner className="w-12 h-12 text-cyan-400"/>
                    <p className="text-lg text-gray-300">{loadingStatus}</p>
                    <p className="text-sm text-gray-500">This may take a moment. The AI is working on creating your scene and renders.</p>
                </div>
            )}

            {images.some(img => img.slicerImage !== null) && (
                 <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white font-bold text-lg border-2 border-cyan-400">
                                2
                            </div>
                            <h2 className="text-2xl font-bold text-gray-200">Generated Realistic Renders</h2>
                        </div>
                        {images.some(img => img.realisticImage) && (
                            <button
                                onClick={handleRegenerateAll}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                            >
                                <ReRenderIcon className="w-5 h-5" />
                                Regenerate All
                            </button>
                        )}
                    </div>
                     <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       {images.filter(img => img.slicerImage !== null).map((image, index) => (
                         <ImageView
                           key={image.id}
                           src={image.realisticImage}
                           label={`Angle ${index + 1}`}
                           isLoading={isLoading && !image.realisticImage}
                           idea={"realistic_render"}
                           onReRender={() => handleReRender(image.id)}
                           isReRendering={reRenderingId === image.id}
                         />
                       ))}
                     </div>
                 </div>
            )}

            {images.some(img => img.slicerImage !== null) && (
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-600 text-white font-bold text-lg border-2 border-cyan-400">
                            3
                        </div>
                        <h2 className="text-2xl font-bold text-gray-200">Generate Title, Description & Tags</h2>
                    </div>
                    <div className="pl-14">
                        <p className="mt-3 mb-5 text-gray-400">Generate a catchy title, a short, engaging description, and relevant tags for platforms like MakerWorld, based on your uploaded images.</p>
                        <button
                            onClick={handleGenerateText}
                            disabled={isGeneratingText || images.filter(img => img.slicerImage).length === 0}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg transition-colors duration-200"
                        >
                            {isGeneratingText ? <Spinner className="w-5 h-5" /> : <PencilSquareIcon className="w-5 h-5" />}
                            {isGeneratingText ? 'Generating...' : 'Generate Text'}
                        </button>
                        
                        {isGeneratingText && <TextContentSkeleton />}

                        {!isGeneratingText && makerWorldContent && (
                            <div className="mt-6 flex flex-col gap-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Generated Title</label>
                                    <div className="relative">
                                        <div className="p-4 bg-gray-900/70 border border-gray-600 rounded-lg text-gray-200 pr-12">
                                            {makerWorldContent.title}
                                        </div>
                                        <button
                                            onClick={() => handleCopy(makerWorldContent.title, 'title')}
                                            className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-gray-400 hover:text-white rounded-md transition-colors"
                                            aria-label="Copy title"
                                        >
                                            {copiedTitle ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Generated Description</label>
                                     <div className="relative">
                                        <div className="p-4 bg-gray-900/70 border border-gray-600 rounded-lg text-gray-200 whitespace-pre-wrap pr-12">
                                            {makerWorldContent.description}
                                        </div>
                                         <button
                                            onClick={() => handleCopy(makerWorldContent.description, 'description')}
                                            className="absolute top-4 right-3 p-2 text-gray-400 hover:text-white rounded-md transition-colors"
                                            aria-label="Copy description"
                                        >
                                            {copiedDescription ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Generated Tags</label>
                                    <div className="flex flex-col gap-2 p-4 bg-gray-900/70 border border-gray-600 rounded-lg">
                                        {makerWorldContent.tags.map((tag) => (
                                            <div key={tag} className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                                                <span className="text-gray-300 font-mono text-sm">{tag}</span>
                                                <button
                                                    onClick={() => handleCopyTag(tag)}
                                                    className={`p-1.5 rounded-md transition-colors ${copiedTags.includes(tag) ? 'bg-green-600 text-white cursor-default' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                                                    aria-label={`Copy tag: ${tag}`}
                                                    disabled={copiedTags.includes(tag)}
                                                >
                                                    {copiedTags.includes(tag) ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">An error occurred: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
        </div>
    );
};

export default Visualizer;