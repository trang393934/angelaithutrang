import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";

interface PostImageGridProps {
  images: string[];
}

export function PostImageGrid({ images }: PostImageGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const getGridLayout = () => {
    const count = images.length;
    
    if (count === 1) {
      return (
        <div 
          className="cursor-pointer group relative rounded-xl overflow-hidden"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt="Post image"
            className="w-full max-h-[500px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="cursor-pointer group relative aspect-square"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={img}
                alt={`Post image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          <div
            className="cursor-pointer group relative row-span-2"
            onClick={() => openLightbox(0)}
          >
            <img
              src={images[0]}
              alt="Post image 1"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {images.slice(1, 3).map((img, idx) => (
            <div
              key={idx}
              className="cursor-pointer group relative aspect-square"
              onClick={() => openLightbox(idx + 1)}
            >
              <img
                src={img}
                alt={`Post image ${idx + 2}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="cursor-pointer group relative aspect-square"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={img}
                alt={`Post image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    // 5+ images - Facebook style with +N overlay
    const displayImages = images.slice(0, 5);
    const remainingCount = count - 5;

    return (
      <div className="grid grid-cols-6 gap-1 rounded-xl overflow-hidden">
        {/* First row - 2 images taking 3 cols each */}
        {displayImages.slice(0, 2).map((img, idx) => (
          <div
            key={idx}
            className="cursor-pointer group relative col-span-3 aspect-[4/3]"
            onClick={() => openLightbox(idx)}
          >
            <img
              src={img}
              alt={`Post image ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
        
        {/* Second row - 3 images taking 2 cols each */}
        {displayImages.slice(2, 5).map((img, idx) => (
          <div
            key={idx + 2}
            className="cursor-pointer group relative col-span-2 aspect-square"
            onClick={() => openLightbox(idx + 2)}
          >
            <img
              src={img}
              alt={`Post image ${idx + 3}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* Show +N overlay on last visible image */}
            {idx === 2 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mb-4">
        {getGridLayout()}
      </div>

      {lightboxOpen && (
        <ImageLightboxGallery
          images={images}
          initialIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// Extended lightbox for gallery navigation
interface ImageLightboxGalleryProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

function ImageLightboxGallery({ images, initialIndex, onClose }: ImageLightboxGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      <div 
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip for many images */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
