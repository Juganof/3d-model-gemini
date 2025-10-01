
import React, { useRef } from 'react';

interface ImageUploadSlotProps {
  label: string;
  image: string | null;
  onImageUpload: (file: File) => void;
  onImageClear: () => void;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PasteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V5.25c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V7.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);


const ImageUploadSlot: React.FC<ImageUploadSlotProps> = ({ label, image, onImageUpload, onImageClear }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageUpload(event.target.files[0]);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageClear();
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handlePaste = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (!navigator.clipboard?.read) {
                alert("Clipboard API not supported by your browser. Please use the 'upload' button.");
                return;
            }

            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: imageType });
                    onImageUpload(file);
                    return;
                }
            }
            alert("No image found in clipboard.");
        } catch (error) {
            console.error("Failed to read from clipboard:", error);
            alert("Could not paste image. Please check browser permissions for clipboard access.");
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div 
                className="w-full aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 relative group cursor-pointer hover:border-cyan-500 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
                {image ? (
                    <>
                        <img src={image} alt={`${label} upload preview`} className="w-full h-full object-contain rounded-lg p-1" />
                        <button
                            onClick={handleClear}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            aria-label={`Clear ${label} image`}
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="text-gray-400 flex flex-col items-center justify-center gap-2 text-center p-2">
                        <UploadIcon className="w-8 h-8"/>
                        <span className="text-sm">Click to upload</span>
                        <span className="text-xs text-gray-500">or</span>
                        <button
                            type="button"
                            onClick={handlePaste}
                            className="inline-flex items-center gap-1.5 bg-gray-600 hover:bg-gray-600/80 text-gray-300 font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                            aria-label="Paste image from clipboard"
                        >
                            <PasteIcon className="w-4 h-4" />
                            Paste Image
                        </button>
                    </div>
                )}
            </div>
            <p className="font-semibold text-gray-300 capitalize">{label}</p>
        </div>
    );
};

export default ImageUploadSlot;
