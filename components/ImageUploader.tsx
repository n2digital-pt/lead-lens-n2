import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { ImageFile } from '../types';

interface ImageUploaderProps {
  selectedImage: ImageFile | null;
  onImageSelect: (image: ImageFile | null) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ selectedImage, onImageSelect, disabled }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onImageSelect({ file, previewUrl });
    }
  }, [onImageSelect]);

  const handleClear = useCallback(() => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.previewUrl);
      onImageSelect(null);
    }
  }, [selectedImage, onImageSelect]);

  if (selectedImage) {
    return (
      <div className="relative w-full aspect-video md:aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
        <img 
          src={selectedImage.previewUrl} 
          alt="Preview of uploaded business image" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-4">
           {!disabled && (
            <button 
              onClick={handleClear}
              className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 focus:bg-white/20 text-white rounded-full transition-colors outline-none focus:ring-2 focus:ring-white"
              aria-label="Remove selected image"
              title="Remove image"
            >
              <X className="w-6 h-6" />
            </button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label 
        className={`
          flex flex-col items-center justify-center w-full aspect-video md:aspect-[4/3] 
          border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 
          hover:bg-slate-100 hover:border-indigo-400 
          focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:ring-offset-2
          transition-all cursor-pointer outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className="mb-4 p-4 bg-white rounded-full shadow-sm" aria-hidden="true">
            <Camera className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="mb-2 text-sm text-slate-700 font-medium">
            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500 max-w-[200px]">
            Photos of storefronts, business cards, flyers, or advertisements (PNG, JPG)
          </p>
        </div>
        <input 
          type="file" 
          className="sr-only" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          aria-label="Upload an image for analysis"
        />
      </label>
    </div>
  );
};

export default ImageUploader;