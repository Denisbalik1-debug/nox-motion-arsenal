import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SwipeStack — A stack of cards/images that can be swiped away with
 * physics-based animation (like Tinder). Shows the next card underneath
 * with a stacked depth effect.
 * NOX-original, inspired by Originkit (originkit.dev).
 */

interface Props {
  images?: string[];
  width?: number;
  height?: number;
  stackCount?: number;         // visible cards in the stack
  stackOffset?: number;        // vertical offset between stacked cards (px)
  stackScale?: number;         // scale reduction per card in stack
  swipeThreshold?: number;     // px distance to trigger swipe
  rotationFactor?: number;     // max rotation during swipe (degrees)
  onSwipe?: (direction: 'left' | 'right', index: number) => void;
  onEmpty?: () => void;
  style?: React.CSSProperties;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
  'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400',
  'https://images.unsplash.com/photo-1574169208507-84376144848b?w=400',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
];

export default function SwipeStack({
  images = DEFAULT_IMAGES,
  width = 340,
  height = 460,
  stackCount = 3,
  stackOffset = 12,
  stackScale = 0.06,
  swipeThreshold = 120,
  rotationFactor = 15,
  onSwipe,
  onEmpty,
  style,
}: Props) {
  const [cards, setCards] = useState(images.map((src, i) => ({ id: i, src })));
  const [swiping, setSwiping] = useState(false);
  const dragXRef = useRef(0);

  const activeIndex = 0;

  const handleDragStart = useCallback(() => {
    setSwiping(true);
  }, []);

  const handleDrag = useCallback(
    (_: any, info: { offset: { x: number } }) => {
      dragXRef.current = info.offset.x;
    },
    [],
  );

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      const { offset, velocity } = info;
      setSwiping(false);

      const absOffset = Math.abs(offset.x);
      const absVelocity = Math.abs(velocity.x);

      if (absOffset > swipeThreshold || absVelocity > 400) {
        const direction = offset.x > 0 ? 'right' : 'left';

        setCards((prev) => {
          const next = prev.slice(1);
          if (next.length === 0) {
            setTimeout(() => onEmpty?.(), 0);
          }
          return next;
        });
        onSwipe?.(direction, cards[activeIndex]?.id ?? 0);
      } else {
        dragXRef.current = 0;
      }
    },
    [swipeThreshold, cards, activeIndex, onSwipe, onEmpty],
  );

  const visibleCards = cards.slice(0, stackCount);

  // If no cards left, show empty state
  if (cards.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          border: '2px dashed rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 18,
          fontWeight: 500,
          ...style,
        }}
      >
        No more cards
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        ...style,
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleCards.map((card, i) => {
          const isTop = i === 0;

          // Stack depth effect: each card below is shifted down and scaled
          const yOffset = i * stackOffset;
          const scale = 1 - i * stackScale;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{
                scale: 0.9,
                opacity: 0,
                y: 20,
              }}
              animate={{
                scale: isTop && swiping ? 1.05 : scale,
                opacity: 1,
                y: yOffset,
                rotate: 0,
                transition: {
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2 },
              }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragStart={isTop ? handleDragStart : undefined}
              onDrag={isTop ? handleDrag : undefined}
              onDragEnd={isTop ? handleDragEnd : undefined}
              whileDrag={{
                rotate:
                  dragXRef.current !== 0
                    ? (dragXRef.current / swipeThreshold) * rotationFactor
                    : 0,
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: isTop ? 'grab' : 'default',
                zIndex: stackCount - i,
                boxShadow: `0 ${4 + i * 2}px ${12 + i * 4}px rgba(0,0,0,0.2${
                  5 - i * 1.5
                })`,
                transformOrigin: 'center bottom',
              }}
            >
              <img
                src={card.src}
                alt={`Card ${card.id}`}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: 16,
                }}
              />

              {/* Swipe hint indicators (top card only) */}
              {isTop && dragXRef.current !== 0 && (
                <>
                  {/* Like (right) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: Math.min(1, dragXRef.current / swipeThreshold),
                    }}
                    style={{
                      position: 'absolute',
                      top: 30,
                      right: 30,
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: '3px solid #4caf50',
                      color: '#4caf50',
                      fontSize: 28,
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.85)',
                      transform: 'rotate(15deg)',
                      pointerEvents: 'none',
                    }}
                  >
                    LIKE
                  </motion.div>

                  {/* Nope (left) */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: Math.min(1, -dragXRef.current / swipeThreshold),
                    }}
                    style={{
                      position: 'absolute',
                      top: 30,
                      left: 30,
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: '3px solid #f44336',
                      color: '#f44336',
                      fontSize: 28,
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.85)',
                      transform: 'rotate(-15deg)',
                      pointerEvents: 'none',
                    }}
                  >
                    NOPE
                  </motion.div>
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Card counter */}
      <div
        style={{
          position: 'absolute',
          bottom: -32,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: 1,
        }}
      >
        {cards.length} card{cards.length !== 1 ? 's' : ''} remaining
      </div>
    </div>
  );
}
