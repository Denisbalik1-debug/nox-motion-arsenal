import { useMemo, type ReactNode } from 'react';
import { seededRandom } from '../../lib/animationUtils';
import type { HeroObjectShellVariant } from './heroObjectFloatPresets';

interface HeroObjectGlassShellProps {
  variant: HeroObjectShellVariant;
  seed: number;
  children: ReactNode;
}

function CornerMarks() {
  return (
    <div className="hof-shell-corners" aria-hidden="true">
      <span className="hof-shell-corner hof-shell-corner-tl" />
      <span className="hof-shell-corner hof-shell-corner-tr" />
      <span className="hof-shell-corner hof-shell-corner-bl" />
      <span className="hof-shell-corner hof-shell-corner-br" />
    </div>
  );
}

export function HeroObjectGlassShell({ variant, seed, children }: HeroObjectGlassShellProps) {
  const specks = useMemo(() => {
    const random = seededRandom(seed * 71 + 19);
    return Array.from({ length: 10 }, (_, index) => ({
      id: index,
      left: 8 + random() * 84,
      top: 8 + random() * 84,
      opacity: 0.08 + random() * 0.22,
      size: 1 + random() * 1.8,
    }));
  }, [seed]);

  return (
    <div className={`hof-glass-shell hof-shell-${variant}`} data-shell={variant}>
      <div className="hof-shell-depth" />
      <div className="hof-shell-surface">
        <div className="hof-shell-tint" />
        <div className="hof-shell-grid" />
        <div className="hof-shell-caustic" />
        <div className="hof-shell-sweep" />
        <div className="hof-shell-edge-light" />
        <div className="hof-shell-noise">
          {specks.map((speck) => (
            <span
              key={speck.id}
              style={{
                left: `${speck.left}%`,
                top: `${speck.top}%`,
                opacity: speck.opacity,
                width: speck.size,
                height: speck.size,
              }}
            />
          ))}
        </div>
        <CornerMarks />
        <div className="hof-shell-serial">NOX // ARTIFACT</div>
        <div className="hof-shell-core">{children}</div>
      </div>
    </div>
  );
}

export default HeroObjectGlassShell;
