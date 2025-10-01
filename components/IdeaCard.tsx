

import React from 'react';
import Spinner from './Spinner';

interface IdeaCardProps {
    idea: string;
    onVisualize: () => void;
    isVisualizing: boolean;
    isSelected?: boolean;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onVisualize, isVisualizing, isSelected }) => {
    return (
        <div className={`bg-gray-800/50 p-4 rounded-xl border flex flex-col gap-4 w-72 h-48 flex-shrink-0 transition-colors ${isSelected ? 'border-cyan-500' : 'border-gray-700'}`}>
            <p className="text-gray-200 italic text-sm flex-grow overflow-y-auto pr-2">"{idea}"</p>
            <button
              onClick={onVisualize}
              disabled={isVisualizing || isSelected}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isVisualizing ? <Spinner className="w-5 h-5" /> : (isSelected ? 'Variations Generated' : 'Visualize Concept')}
            </button>
        </div>
    );
};

export default IdeaCard;