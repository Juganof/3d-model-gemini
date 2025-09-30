
import React, { useState } from 'react';
import type { SavedModel } from '../types';
import { MODEL_VIEWS } from '../types';

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const SavedModelCard: React.FC<{ model: SavedModel; onDelete: (id: string) => void; }> = ({ model, onDelete }) => {
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  const handleDownload = (src: string, view: string, idea: string) => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    const sanitizedIdea = idea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = src.split(';')[0].split('/')[1] || 'png';
    link.download = `${sanitizedIdea}_${view}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = (modelToDownload: SavedModel) => {
    const sanitizedIdea = modelToDownload.idea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    MODEL_VIEWS.forEach(view => {
        const src = modelToDownload.images[view];
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

  return (
    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {MODEL_VIEWS.map(view => (
          <div key={view} className="flex flex-col items-center gap-2">
            <div className="w-full aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center relative group">
              {model.images[view] ? (
                <>
                  <img src={model.images[view]!} alt={`${view} view`} className="w-full h-full object-cover rounded-lg" />
                   <button
                    onClick={() => handleDownload(model.images[view]!, view, model.idea)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label={`Download ${view} view`}
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="text-gray-500">Image not available</div>
              )}
            </div>
            <p className="font-semibold text-gray-300 capitalize">{view} View</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-gray-200">Idea:</h3>
        <p className="text-gray-300 mb-4 italic">"{model.idea}"</p>
        
        <div className="flex justify-between items-start gap-4">
            <div>
                 <button 
                    onClick={() => setIsPromptVisible(!isPromptVisible)} 
                    className="text-cyan-400 hover:text-cyan-300 font-medium text-sm"
                    aria-expanded={isPromptVisible}
                 >
                    {isPromptVisible ? 'Hide' : 'Show'} Generation Prompt
                </button>
                {isPromptVisible && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-md">
                    <pre className="text-gray-400 text-xs whitespace-pre-wrap font-mono">{model.frontViewPrompt}</pre>
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => handleDownloadAll(model)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    aria-label="Download all images for this model"
                >
                    Download All
                </button>
                <button
                    onClick={() => onDelete(model.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex-shrink-0"
                    aria-label="Delete saved model"
                >
                    Delete
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SavedModelCard;
