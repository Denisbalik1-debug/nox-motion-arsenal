import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

/**
 * CursorImageGallery — gallery where images follow/reveal based on cursor
 * position. Moving the mouse slides between images.
 * NOX-original, inspired by Originkit (originkit.dev/components/cursor-image-gallery).
 */

interface Props {
  images?: string[];
  width?: number;
  height?: number;
  sensitivity?: number;
  style?: React.CSSProperties;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
  'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600',
];

export default function CursorImageGallery({
  images = DEFAULT_IMAGES,
  width = 600,
  height = 400,
  sensitivity = 1.5,
  style,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(images.length - 1, Math.floor(x * images.length * sensitivity));
    setActiveIndex(Math.max(0, idx));
  }, [images.length, sensitivity]);

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        cursor: 'crosshair',
        ...style,
      }}
    >
      {images.map((img, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: i === activeIndex ? 1 : 0,
            scale: i === activeIndex ? 1 : 1.1,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <img
            src={img}
            alt={`Gallery ${i}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </motion.div>
      ))}
    </div>
  );
}
