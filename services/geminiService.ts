
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import type { ModelView } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && error.message.includes('503')) {
            console.warn(`Model is overloaded. Retrying in ${delay / 1000}s... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
            return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw error;
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

export async function generateModelIdeas(
  existingIdeas: string[] = [],
  inspirationKeywords: string[],
  inspirationImage: string | null = null,
  focusedKeywords: string[] = [],
  excludedKeywords: string[] = []
): Promise<string[]> {
  try {
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];

    let promptText = `Generate a JSON array containing exactly 4 concise, creative, and interesting ideas for 3D models.

**Primary Goal:** The ideas MUST BE purely decorative, artistic, or for entertainment. This includes sculptures, character figures, desk toys, miniatures, articulated creatures, and fan art.

**--- ABSOLUTE PROHIBITION on Functional Items ---**
You MUST NOT generate any ideas that are primarily functional. This includes, but is not limited to:
- Organizers (desk organizers, cable organizers, etc.)
- Holders (pen holders, phone holders, headphone holders, candle holders, etc.)
- Stands (phone stands, headphone stands, laptop stands, etc.)
- Cases (phone cases, storage cases, etc.)
- Mounts, brackets, hooks, or clips.
- Vases, planters, or any kind of container whose primary purpose is to hold something.
- Tools or functional parts.

Any idea whose description includes words like "organizer", "holder", "stand", "case", "mount", "hook", "clip", "tray", "box", or "container" is STRICTLY FORBIDDEN. The focus must be 100% on artistic and non-functional models. A "dragon sculpture" is good. A "dragon phone holder" is bad.
`;

    if (excludedKeywords.length > 0) {
        promptText += `\n**--- STRICTLY EXCLUDED KEYWORDS ---**\nYou MUST NOT generate any ideas containing or related to the following keywords: ${JSON.stringify(excludedKeywords)}\n`;
    }

    promptText += `
**Printability:** The models must be suitable for FDM/FDD 3D printing (no floating/thin parts, minimal supports).

**Crucial Instructions:**
1.  **Thematic Diversity:** Ensure the 4 ideas are thematically diverse. For example, try to include a mix of categories like desk toys, characters, fan art, and abstract pieces. Do not generate four ideas from the same category (e.g., four different dragons).
2.  **Avoid Repetition:** Do not generate any of the following ideas that have already been suggested in this session:
    ${JSON.stringify(existingIdeas)}
`;
    
    if (focusedKeywords.length > 0) {
        promptText += `\n**--- FOCUSED INSPIRATION ---**\nYou MUST ensure that all 4 generated ideas are directly and heavily inspired by the following keywords: ${JSON.stringify(focusedKeywords)}. These are the primary themes for this generation. Thematic diversity should be maintained *within* this focused context.`;
    }

    const inspirationSources: string[] = [];
    if (inspirationImage) {
        const { mimeType, data } = dataUrlToParts(inspirationImage);
        parts.push({ inlineData: { data, mimeType } });
        inspirationSources.push("Primarily draw inspiration from the attached word cloud image which shows popular search terms.");
    }

    if (inspirationKeywords.length > 0) {
        inspirationSources.push(`Also consider this list of inspirational keywords: ${JSON.stringify(inspirationKeywords)}`);
    }

    if (inspirationSources.length > 0) {
        promptText += `\n**Inspiration Sources (General Context):**\n- ${inspirationSources.join('\n- ')}`;
    }


    promptText += "\n\nRespond with ONLY a JSON array containing exactly 4 unique strings.";

    // The text part must be last when sending an image
    parts.push({ text: promptText });
    
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                description: "An array containing exactly 4 unique, non-functional, 3D model ideas.",
                items: {
                    type: Type.STRING,
                    description: 'A single creative, interesting, NON-FUNCTIONAL 3D model idea.'
                }
            }
        }
    }));
    
    const ideas = JSON.parse(response.text);
    if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error("Invalid response format from AI model. Expected a JSON array of strings.");
    }
    return ideas;

  } catch (error) {
    console.error("Error generating model ideas:", error);
    throw new Error("Failed to generate model ideas. The model might be temporarily unavailable. Please try again later.");
  }
}

export async function extractKeywordsFromIdeas(ideas: string[]): Promise<string[]> {
    try {
        const prompt = `Analyze the following list of 4 3D model ideas. For each idea, extract 1-3 of the most important and descriptive keywords that capture the essence of the model.

**Ideas:**
${JSON.stringify(ideas)}

**Instructions:**
- Focus on nouns and descriptive adjectives.
- Keywords should be lowercase.
- Combine all keywords from all ideas into a single list.
- The final list must contain only unique keywords. Do not include duplicates.

**Example:**
If the input is ["A stylized, low-poly fox statue for a desk", "An articulated robot action figure"], the output should be ["stylized", "low-poly", "fox", "statue", "desk", "articulated", "robot", "action figure"].

Respond with ONLY a JSON array of unique strings.`;

        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'A single, unique, lowercase keyword extracted from the ideas.'
                    }
                }
            }
        }));

        const keywords = JSON.parse(response.text);
        if (!Array.isArray(keywords)) {
            throw new Error("Invalid response format from AI model. Expected a JSON array of strings.");
        }
        return keywords.map(kw => kw.toLowerCase().trim()).filter(Boolean);

    } catch (error) {
        console.error("Error extracting keywords from ideas:", error);
        throw new Error("Failed to extract keywords from the generated ideas. The model might be temporarily unavailable. Please try again.");
    }
}

export async function extractKeywordsFromImage(imageDataUrl: string): Promise<string[]> {
    try {
      const { mimeType, data } = dataUrlToParts(imageDataUrl);
      const imagePart = { inlineData: { data, mimeType } };
      const textPart = { text: "Analyze the provided word cloud image. Extract all visible words and return them as a single JSON array of lowercase strings. Exclude any numbers or symbols. Ensure the output is only the JSON array." };
  
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: 'A single word extracted from the image.'
            }
          }
        }
      }));
  
      const keywords = JSON.parse(response.text);
      if (!Array.isArray(keywords)) {
        throw new Error("Invalid response format from AI model. Expected a JSON array of strings.");
      }
      return keywords.map(kw => kw.toLowerCase().trim()).filter(Boolean);
  
    } catch (error) {
      console.error("Error extracting keywords from image:", error);
      throw new Error("Failed to extract keywords from the image. The model might be temporarily unavailable or the image could not be processed. Please try again.");
    }
}

export function getFrontViewPrompt(idea: string): string {
  return `**Subject:** A 3D model of a "${idea}".
**Purpose:** To showcase a 3D printable model.
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

        const generateSingleVariation = (): Promise<GenerateContentResponse> => {
            return retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [ { text: frontPrompt } ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            }));
        };

        const variationPromises = [
            generateSingleVariation(),
            generateSingleVariation(),
            generateSingleVariation(),
            generateSingleVariation(),
        ];

        const responses = await Promise.all(variationPromises);

        const variations = responses.map(response => {
            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
            throw new Error(`A front view variation could not be generated from the model's response.`);
        });

        if (variations.length < 4) {
            throw new Error("Failed to generate all 4 front view variations.");
        }

        return variations;

    } catch (error) {
        console.error("Error generating front view variations:", error);
        throw new Error("Failed to generate front view variations. The model might be temporarily unavailable. Please try again later.");
    }
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
                    viewSpecificInstruction = `Generate the ${view} view of the model.`;
            }

            const editPrompt = `This is the front view of a single-color 3D model on a solid white background. ${viewSpecificInstruction} Maintain the exact same single-color, clay-render style and the solid white background. The model must also be suitable for FDM/FDD printing: no floating parts, no thin delicate parts, and designed for minimal support. The output image must ONLY contain the 3D model object and nothing else.`;
            
            const nanoResponse = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
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
            }));

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
        throw new Error("A failure occurred during generation of other views. The model might be temporarily unavailable. Please try again later.");
    }
}

export async function generateSceneDescription(images: Record<string, string>, colorOption: 'single' | 'multi'): Promise<string> {
    try {
      const imageParts = Object.values(images).map(dataUrl => {
          const { mimeType, data } = dataUrlToParts(dataUrl);
          return { inlineData: { data, mimeType } };
      });
  
      const colorInstruction = colorOption === 'single'
        ? 'The object must be a single, solid color.'
        : 'The object can have multiple distinct colors, as if printed with a multi-material unit.';

      const prompt = `Based on these views of a 3D model from a slicer software, describe a single, cohesive, realistic, high-quality photorealistic scene where this object, as a physical 3D-printed item, could be placed. 
  
  Describe the following in one concise paragraph:
  - The object's material and finish (e.g., matte PLA plastic, glossy resin).
  - Coloration: ${colorInstruction}
  - The surface it's on (e.g., rustic wooden desk, polished marble countertop).
  - The background elements (e.g., a blurred bookshelf, a minimalist wall with a plant).
  - The lighting (e.g., soft morning light from a window, dramatic studio lighting).
  
  Example: "A 3D-printed matte-black PLA plastic dragon sculpture sits on a rustic wooden desk, next to a small succulent plant, with soft morning light coming from a window on the left."
  
  Respond with ONLY the descriptive paragraph.`;
  
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [ ...imageParts, { text: prompt } ]
        },
      }));
  
      return response.text;
    } catch (error) {
      console.error("Error generating scene description:", error);
      throw new Error("Failed to generate a scene description. The model might be temporarily unavailable. Please try again later.");
    }
}
  
  
export async function generateRealisticView(
      slicerImageDataUrl: string,
      sceneDescription: string,
      view: string,
      showLayerLines: boolean,
): Promise<string> {
    try {
        const { mimeType, data } = dataUrlToParts(slicerImageDataUrl);

        const layerLinesInstruction = showLayerLines
            ? `\n5.  **Printing Detail:** The object should have very subtle, fine horizontal layer lines, characteristic of FDM 3D printing.`
            : '';

        const prompt = `**Scene:** ${sceneDescription}
---
**Task:** Transform the provided slicer image of a 3D model into a photorealistic image.
**Instructions:**
1.  **Re-render Object:** Re-create the object from the slicer image, maintaining its exact shape and perspective. It should look like a real, physical object made of the material described in the scene.
2.  **Place in Scene:** Place this re-rendered object into the described scene.
3.  **Realism:** Ensure the final image is photorealistic, with accurate lighting, shadows, and textures that match the scene description.
4.  **Output:** The output image must ONLY contain the object within the described scene. Do not include any text, UI elements, or other artifacts.${layerLinesInstruction}`;

        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        }));

        const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            const newImageBytes = imagePart.inlineData.data;
            const newImageUrl = `data:${imagePart.inlineData.mimeType};base64,${newImageBytes}`;
            return newImageUrl;
        } else {
            console.error("No image part in response for view:", view, response);
            throw new Error(`Failed to generate the realistic ${view} view.`);
        }
    } catch (error) {
        console.error(`Error generating realistic ${view} view:`, error);
        throw new Error(`A failure occurred during generation of the realistic ${view} view. The model might be temporarily unavailable. Please try again later.`);
    }
}


export async function generateMakerWorldContent(images: Record<string, string>): Promise<{ title: string; description: string; tags: string[] }> {
    try {
      const firstImageDataUrl = Object.values(images)[0];
      if (!firstImageDataUrl) {
        throw new Error("No images provided to generate MakerWorld content.");
      }
      const { mimeType, data } = dataUrlToParts(firstImageDataUrl);
      const imagePart = { inlineData: { data, mimeType } };

      const prompt = `Based on this image of a 3D model, generate a concise title, a short, engaging description, and a list of relevant tags for a 3D model sharing platform like MakerWorld.
  
  **Instructions:**
  1.  **Title:** Create a short, catchy, and descriptive title.
  2.  **Description:** Write a 2-3 sentence description.
      - The first sentence should describe what the model is and its style.
      - The second sentence should suggest who it's for or what its use is (e.g., "Perfect for fans, collectors, or as a desk ornament.").
      - Keep the tone enthusiastic and appealing.
  3.  **Tags:** Generate a list of 5-10 relevant, single-word or short-phrase tags (e.g., "sculpture", "dragon", "fantasy", "lowpoly", "desktoy"). The tags should be lowercase.
  
  **Example Response Format:**
  {
    "title": "Stylized Mandalorian Bust",
    "description": "A detailed bust of the Mandalorian, showcasing his iconic helmet and armor in a clean, stylized design. Perfect for Star Wars fans, collectors, or anyone looking to bring the strength and mystery of the galaxy’s favorite bounty hunter to their display.",
    "tags": ["starwars", "mandalorian", "bust", "sculpture", "disney", "fanart", "helmet"]
  }
  
  Respond with ONLY a JSON object containing 'title', 'description', and 'tags' keys.`;
  
      const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [ imagePart, { text: prompt } ]
        },
      }));
  
      // The model may return the JSON string wrapped in markdown
      let jsonString = response.text;
      const match = jsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
      if (match && match[2]) {
        jsonString = match[2];
      }

      const result = JSON.parse(jsonString.trim());
      if (!result.title || !result.description || !Array.isArray(result.tags)) {
          throw new Error("Invalid response format from AI model. Expected title, description, and tags array.");
      }
      return result;
  
    } catch (error) {
      console.error("Error generating MakerWorld content:", error);
      throw new Error("Failed to generate title, description, and tags. The model might be temporarily unavailable. Please try again later.");
    }
  }