
import React from 'react';
import Spinner from './Spinner';

interface ImageViewProps {
  src: string | null;
  label: string;
  isLoading: boolean;
  idea: string;
}

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ImageView: React.FC<ImageViewProps> = ({ src, label, isLoading, idea }) => {
  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    const sanitizedIdea = idea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = src.split(';')[0].split('/')[1] || 'png';
    link.download = `${sanitizedIdea}_${label}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 relative group">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Spinner />
            <p>Generating...</p>
          </div>
        ) : src ? (
          <>
            <img src={src} alt={`${label} view`} className="w-full h-full object-cover rounded-lg" />
            <button
                onClick={handleDownload}
                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label={`Download ${label} view`}
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-gray-500">Not generated</div>
        )}
      </div>
      <p className="font-semibold text-gray-300 capitalize">{label} View</p>
    </div>
  );
};

export default ImageView;
