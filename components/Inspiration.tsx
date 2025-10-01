
import React, { useState, useRef } from 'react';
import ImageUploadSlot from './ImageUploadSlot';
import { extractKeywordsFromImage } from '../services/geminiService';
import Spinner from './Spinner';

interface InspirationProps {
  inspirationImage: string | null;
  onSetInspirationImage: (image: string | null) => void;
  inspirationKeywords: string[];
  onAddKeyword: (keyword: string) => void;
  onAddKeywords: (keywords: string[]) => void;
  onRemoveKeyword: (keyword: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.548 0A48.108 48.108 0 016.25 5.397m12.15-3.007a48.09 48.09 0 01-5.69 0" />
    </svg>
);

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


const Inspiration: React.FC<InspirationProps> = ({ 
    inspirationImage, 
    onSetInspirationImage,
    inspirationKeywords,
    onAddKeyword,
    onAddKeywords,
    onRemoveKeyword,
    onExportData,
    onImportData
}) => {
    const [newKeyword, setNewKeyword] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
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

    const handleAddKeywordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedKeyword = newKeyword.trim().toLowerCase();
        if (trimmedKeyword) {
            onAddKeyword(trimmedKeyword);
            setNewKeyword('');
        }
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
    
    return (
        <div className="flex flex-col gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold mb-2 text-cyan-300">Inspiration Sources</h2>
                <p className="text-gray-400 mb-6">Manage the data sources the AI uses to generate new model ideas. You can upload a word cloud or manually add keywords.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Inspiration */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-semibold text-gray-200">Image-based Inspiration</h3>
                        <p className="text-sm text-gray-400">Upload a single image, like a word cloud of popular search terms, to give the AI visual context for new ideas.</p>
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

                    {/* Keyword Inspiration */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-semibold text-gray-200">Keyword-based Inspiration</h3>
                        <p className="text-sm text-gray-400">Add, remove, and view the list of keywords used for generating ideas. These are used in addition to any uploaded image.</p>
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-64 overflow-y-auto">
                            {inspirationKeywords.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {inspirationKeywords.sort().map(keyword => (
                                        <span key={keyword} className="flex items-center gap-2 bg-purple-600/50 text-purple-200 text-sm font-medium px-3 py-1 rounded-full border border-purple-500">
                                            {keyword}
                                            <button onClick={() => onRemoveKeyword(keyword)} className="text-purple-300 hover:text-white" aria-label={`Remove ${keyword}`}>
                                                <TrashIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center mt-8">No keywords added yet.</p>
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
