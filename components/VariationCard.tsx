import React from 'react';
import Spinner from './Spinner';

interface VariationCardProps {
  src: string;
  onSelect: () => void;
  isLoading: boolean;
  isGenerated: boolean;
}

const VariationCard: React.FC<VariationCardProps> = ({ src, onSelect, isLoading, isGenerated }) => {
  const isDisabled = isLoading || isGenerated;
  
  let buttonText = 'Select & Generate';
  if (isLoading) {
    buttonText = 'Generating...';
  } else if (isGenerated) {
    buttonText = 'Generated';
  }

  return (
    <div className={`bg-gray-700/50 rounded-lg p-2 border border-gray-600 flex flex-col gap-3 transition-all duration-200 w-60 flex-shrink-0 ${!isDisabled ? 'hover:scale-105 hover:border-purple-500' : ''}`}>
      <div className="aspect-square bg-gray-900 rounded-md overflow-hidden">
        <img src={src} alt="Model concept" className="w-full h-full object-cover" />
      </div>
      <button
        onClick={onSelect}
        disabled={isDisabled}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isLoading && <Spinner className="w-5 h-5"/>}
        {buttonText}
      </button>
    </div>
  );
};

export default VariationCard;