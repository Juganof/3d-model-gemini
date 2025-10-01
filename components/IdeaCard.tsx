
import React from 'react';
import Spinner from './Spinner';

interface IdeaCardProps {
    idea: string;
    onVisualize: () => void;
    isVisualizing: boolean;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onVisualize, isVisualizing }) => {
    return (
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col justify-between gap-4">
            <p className="text-gray-200 italic h-full">"{idea}"</p>
            <button
              onClick={onVisualize}
              disabled={isVisualizing}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isVisualizing ? <Spinner className="w-5 h-5" /> : 'Visualize Concept'}
            </button>
        </div>
    );
};

export default IdeaCard;
