


import React, { useState, useRef } from 'react';
import ImageUploadSlot from './ImageUploadSlot';
import { extractKeywordsFromImage } from '../services/geminiService';
import Spinner from './Spinner';

interface InspirationProps {
  inspirationImage: string | null;
  onSetInspirationImage: (image: string | null) => void;
  onAddKeywords: (keywords: string[]) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  excludedKeywords: string[];
  onAddExcludedKeyword: (keyword: string) => void;
  onRemoveExcludedKeyword: (keyword: string) => void;
}

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.5 1.591L5.22 15.25a.75.75 0 00.53 1.285h11.498a.75.75 0 00.53-1.285l-4.03-4.842a2.25 2.25 0 01-.5-1.591V3.104M15.75 21v-5.657a2.25 2.25 0 00-.5-1.591l-4.03-4.842a.75.75 0 00-1.06 0l-4.03 4.842a2.25 2.25 0 00-.5 1.591V21" />
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

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Inspiration: React.FC<InspirationProps> = ({ 
    inspirationImage, 
    onSetInspirationImage,
    onAddKeywords,
    onExportData,
    onImportData,
    excludedKeywords,
    onAddExcludedKeyword,
    onRemoveExcludedKeyword,
}) => {
    const [isExtracting, setIsExtracting] = useState(false);
    const [newExcludedKeyword, setNewExcludedKeyword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImportData(event.target.files[0]);
            if (event.target) event.target.value = '';
        }
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                onSetInspirationImage(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleImageClear = () => {
        onSetInspirationImage(null);
    };

    const handleExtractKeywords = async () => {
        if (!inspirationImage) return;

        setIsExtracting(true);
        setError(null);
        try {
            const keywords = await extractKeywordsFromImage(inspirationImage);
            onAddKeywords(keywords);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during extraction.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAddExcludedSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddExcludedKeyword(newExcludedKeyword);
        setNewExcludedKeyword('');
    };
    
    return (
        <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold mb-2 text-cyan-300">Inspiration Sources</h2>
                <p className="text-gray-400 mb-6">Manage the data sources the AI uses to generate new model ideas. You can upload a word cloud or manage a list of keywords to exclude.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4 border-r-0 md:border-r md:border-gray-700 md:pr-8">
                        <h3 className="text-xl font-semibold text-gray-200">Image-based Inspiration</h3>
                        <p className="text-sm text-gray-400">Upload a single image, like a word cloud of popular search terms, to give the AI visual context for new ideas. Extracted keywords will be added to the list on the Generator page.</p>
                        <div className="max-w-xs">
                             <ImageUploadSlot
                                label="Inspiration Image"
                                image={inspirationImage}
                                onImageUpload={handleImageUpload}
                                onImageClear={handleImageClear}
                            />
                        </div>
                        <button
                            onClick={handleExtractKeywords}
                            disabled={!inspirationImage || isExtracting}
                            className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 max-w-xs"
                        >
                            {isExtracting ? <Spinner className="w-5 h-5"/> : <WandIcon className="w-5 h-5"/>}
                            {isExtracting ? 'Extracting Keywords...' : 'Extract Keywords from Image'}
                        </button>
                        {error && (
                            <p className="text-sm text-red-400 max-w-xs">{error}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-semibold text-red-300">Excluded Keywords</h3>
                        <p className="text-sm text-gray-400">Add keywords here to strictly prevent them from appearing in generated ideas. Adding a keyword here will remove it from your main inspiration list.</p>
                        
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 h-36 overflow-y-auto">
                            {excludedKeywords.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {excludedKeywords.sort().map(keyword => (
                                        <div key={keyword} className="flex items-center gap-1.5 bg-red-900/50 text-red-200 border border-red-700/80 text-sm font-medium px-3 py-1 rounded-full">
                                            <span>{keyword}</span>
                                            <button 
                                                onClick={() => onRemoveExcludedKeyword(keyword)} 
                                                className="text-red-300 hover:text-white"
                                                aria-label={`Remove excluded keyword: ${keyword}`}
                                            >
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center flex items-center justify-center h-full text-sm">No keywords excluded yet.</p>
                            )}
                        </div>
                        
                        <form onSubmit={handleAddExcludedSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={newExcludedKeyword}
                                onChange={(e) => setNewExcludedKeyword(e.target.value)}
                                placeholder="Exclude a keyword..."
                                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                Exclude
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-cyan-300">Data Management</h2>
                <p className="text-gray-400 mb-6">Save your current gallery and inspiration settings to a file, or load them from a previously saved file.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onExportData}
                        className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Export Data
                    </button>
                    
                    <input
                        type="file"
                        accept="application/json"
                        ref={importInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => importInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                        <UploadIcon className="w-5 h-5" />
                        Import Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Inspiration;