import { useCallback } from "react";

interface NotesStepProps {
  value: string;
  onChange: (v: string) => void;
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  showPhotos?: boolean;
}

// Notes and optional photo upload step
export default function NotesStep({ value, onChange, photos, onPhotosChange, showPhotos = true }: NotesStepProps) {
  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    onPhotosChange([...photos, ...incoming]);
  }, [photos, onPhotosChange]);

  const removePhoto = useCallback((index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }, [photos, onPhotosChange]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Anything else we need to know? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Tell us anything important about access, timing, item size, or special requirements..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          data-testid="notes-textarea"
        />
      </div>

      {showPhotos && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Attach photos <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Photos help us confirm the right van size and pricing. JPG or PNG, up to 10 MB each.
          </p>

          {/* Existing photos grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                    <img
                      src={url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(url)}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-0.5">
                      <p className="text-white text-[10px] truncate">{file.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload drop zone */}
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-5 px-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            data-testid="photo-upload-label"
          >
            <svg className="w-7 h-7 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600 font-medium">
              {photos.length > 0 ? "Add more photos" : "Tap to add photos"}
            </span>
            <span className="text-xs text-gray-400 mt-1">Images only · multiple allowed</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
              data-testid="photo-upload-input"
            />
          </label>
        </div>
      )}
    </div>
  );
}
