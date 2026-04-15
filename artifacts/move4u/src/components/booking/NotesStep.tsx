interface NotesStepProps {
  value: string;
  onChange: (v: string) => void;
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  showPhotos?: boolean;
}

// Notes and optional photo upload step
export default function NotesStep({ value, onChange, photos, onPhotosChange, showPhotos = true }: NotesStepProps) {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onPhotosChange(files);
  };

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
            Would you like to attach pictures? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Photos can help us confirm the right van size and pricing more accurately.
          </p>
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-6 px-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            data-testid="photo-upload-label"
          >
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-600">Attach photos (optional)</span>
            <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
              data-testid="photo-upload-input"
            />
          </label>
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((f, i) => (
                <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
