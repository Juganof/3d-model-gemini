
export const MODEL_VIEWS = ['front', 'left', 'right', 'back'] as const;
export type ModelView = typeof MODEL_VIEWS[number];

export type ImageState = Record<ModelView, string | null>;

export interface GeneratedModel {
  idea: string;
  images: ImageState;
  isSaved: boolean;
}

export interface SavedModel {
  id: string; // Using frontViewUrl as ID
  idea: string;
  frontViewPrompt: string;
  images: ImageState;
  timestamp: number;
}