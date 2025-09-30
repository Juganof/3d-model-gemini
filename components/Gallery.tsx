
import React from 'react';
import type { SavedModel } from '../types';
import SavedModelCard from './SavedModelCard';

interface GalleryProps {
  savedModels: SavedModel[];
  onDeleteModel: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ savedModels, onDeleteModel }) => {
  return (
    <div className="w-full">
      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-cyan-300">My Saved Models</h2>
        {savedModels.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Your gallery is empty. Go to the generator to create and save your first model!
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {savedModels.sort((a, b) => b.timestamp - a.timestamp).map(model => (
              <SavedModelCard key={model.id} model={model} onDelete={onDeleteModel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
