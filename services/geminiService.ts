
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ModelView } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateModelIdeas(existingIdeas: string[] = []): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a list of 4 concise, creative ideas for a 3D model, drawing inspiration from the list of popular search terms below. Each model must be purely decorative, artistic, and explicitly non-functional. If a search term is for a functional item (like a 'pen holder' or 'organizer'), you must transform it into a non-functional, sculptural art piece. The models must also be suitable for FDM/FDD 3D printing (no floating/thin parts, minimal supports).

**Crucial Instructions:**
1.  **Thematic Diversity:** Ensure the 4 ideas are thematically diverse. For example, try to include a mix of categories like characters, abstract art, nature, and technology. Do not generate four ideas from the same category (e.g., four different dragons).
2.  **Avoid Repetition:** Do not generate any of the following ideas that have already been suggested in this session:
    ${JSON.stringify(existingIdeas)}

Popular search terms for inspiration:
"halloween", "fidget", "dragon", "pokemon", "ghost", "skull", "dino", "groot", "spiderman", "batman", "star wars", "harry potter", "minecraft", "hollow knight", "cat", "axolotl", "octopus", "spider", "articulated", "flexi", "low-poly", "vase", "planter", "organizer", "container", "stand", "holder", "wall art", "sculpture", "miniature", "robot", "rocket", "car", "sword", "dice tower"

Respond with ONLY a JSON array of 4 unique strings.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: 'A single non-functional, decorative 3D model idea.'
                }
            }
        }
    });
    
    const ideas = JSON.parse(response.text);
    if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error("Invalid response format from AI model. Expected a JSON array of strings.");
    }
    return ideas;

  } catch (error) {
    console.error("Error generating model ideas:", error);
    throw new Error("Failed to generate model ideas. Please try again.");
  }
}

export function getFrontViewPrompt(idea: string): string {
  return `**Subject:** A 3D model of a "${idea}".
**Purpose:** The model is a non-functional, decorative art piece.
**Style:** Photorealistic render, clay model style.
**Color:** Single, solid, matte grey color.
**Background:** Solid, pure white, seamless background.
**Composition:** Centered, front view of the object.
**Lighting:** Professional studio lighting.
**Constraints for 3D Printing:** The design must be simple enough for FDM/FDD 3D printing. This means no floating parts, no extremely thin or delicate structures, and it should require minimal support structures.
**Crucial instruction:** The image must ONLY contain the 3D model object described. Do NOT include any humans, people, animals, text, or other objects.`;
}


export async function generateFrontViewVariations(idea: string): Promise<string[]> {
    try {
      const frontPrompt = getFrontViewPrompt(idea);
      
      const imagenResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: frontPrompt,
          config: {
              numberOfImages: 4,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
          },
      });
  
      if (!imagenResponse.generatedImages || imagenResponse.generatedImages.length === 0) {
          throw new Error("Failed to generate any front view variations.");
      }
  
      return imagenResponse.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
  
    } catch (error) {
      console.error("Error generating front view variations:", error);
      throw new Error("Failed to generate front view variations. Please try again.");
    }
}

function dataUrlToParts(dataUrl: string): { mimeType: string; data: string } {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const data = parts[1];
    if (!mimeType || !data) {
        throw new Error("Invalid data URL");
    }
    return { mimeType, data };
}

export async function generateOtherViews(
  frontImageDataUrl: string,
  onImageGenerated: (view: Exclude<ModelView, 'front'>, url: string) => void
): Promise<void> {
    try {
        const { mimeType, data: frontImageData } = dataUrlToParts(frontImageDataUrl);

        const otherViews: Exclude<ModelView, 'front'>[] = ['left', 'right', 'back'];

        for (const view of otherViews) {
            let viewSpecificInstruction: string;
            switch (view) {
                case 'left':
                    viewSpecificInstruction = "Generate the model's left side view.";
                    break;
                case 'right':
                    viewSpecificInstruction = "Generate the model's right side view.";
                    break;
                case 'back':
                    viewSpecificInstruction = "Generate the model's back view.";
                    break;
                default:
                    // This case should not be reached with the current type definition
                    viewSpecificInstruction = `Generate the ${view} view of the model.`;
            }

            const editPrompt = `This is the front view of a single-color, non-functional, decorative 3D model on a solid white background. ${viewSpecificInstruction} Maintain the exact same single-color, clay-render style and the solid white background. The model must also be suitable for FDM/FDD printing: no floating parts, no thin delicate parts, and designed for minimal support. The output image must ONLY contain the 3D model object and nothing else.`;
            
            const nanoResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: frontImageData, mimeType } },
                        { text: editPrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = nanoResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                const newImageBytes = imagePart.inlineData.data;
                const newImageUrl = `data:${imagePart.inlineData.mimeType};base64,${newImageBytes}`;
                onImageGenerated(view, newImageUrl);
            } else {
                throw new Error(`Failed to generate the ${view} view.`);
            }
        }
    } catch (error) {
        console.error("Error generating other model views:", error);
        throw new Error("A failure occurred during generation of other views. Please try again.");
    }
}
