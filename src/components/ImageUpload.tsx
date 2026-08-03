import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  compact?: boolean;
}

/**
 * Reusable image upload component.
 * - Selects local images via file input
 * - Compresses/resizes to max 1200px width, JPEG quality 0.8
 * - Converts to base64 data URLs
 * - Shows preview thumbnails with delete buttons
 */
export default function ImageUpload({ images, onChange, maxImages = 9, compact = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: string[] = [];
      const remaining = maxImages - images.length;

      for (let i = 0; i < Math.min(files.length, remaining); i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImage(file, 1200, 0.8);
        newImages.push(dataUrl);
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-black/5" style={{ background: 'rgba(255,255,255,0.5)' }}>
              <img src={img} alt={`图片 ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-muted-fg hover:text-primary transition-colors disabled:opacity-50`}
        >
          {uploading ? (
            <Loader2 size={compact ? 14 : 16} className="animate-spin" />
          ) : (
            <ImagePlus size={compact ? 14 : 16} />
          )}
          {uploading ? '处理中...' : `添加图片${images.length > 0 ? ` (${images.length}/${maxImages})` : ''}`}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

/**
 * Compress and resize an image file to a base64 data URL.
 * - Max dimension: maxSize px (width or height, whichever is larger)
 * - Output format: JPEG (for photos) or PNG (for images with transparency)
 * - Quality: 0.8 for JPEG
 */
function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Use JPEG for opaque images, PNG for transparent
        const hasAlpha = file.type === 'image/png';
        const dataUrl = hasAlpha
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', quality);

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
