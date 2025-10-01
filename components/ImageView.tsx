
import React from 'react';
import Spinner from './Spinner';

interface ImageViewProps {
  src: string | null;
  label: string;
  isLoading: boolean;
  idea: string;
  onReRender?: () => void;
  isReRendering?: boolean;
}

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ReRenderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v4.992h-4.992m0 0L9.18 7.964a8.25 8.25 0 0111.664 0l3.181 3.183" />
    </svg>
);


const ImageView: React.FC<ImageViewProps> = ({ src, label, isLoading, idea, onReRender, isReRendering }) => {
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
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={handleDownload}
                    className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
                    aria-label={`Download ${label} view`}
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
                {onReRender && (
                    <button
                        onClick={onReRender}
                        disabled={isReRendering}
                        className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Re-render ${label} view`}
                    >
                        <ReRenderIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            {isReRendering && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center gap-2 rounded-lg">
                    <Spinner />
                    <p className="text-sm text-gray-300">Re-rendering...</p>
                </div>
            )}
          </>
        ) : (
          <div className="text-gray-500">Not generated</div>
        )}
      </div>
      <p className="font-semibold text-gray-300 capitalize">{label}</p>
    </div>
  );
};

export default ImageView;
