import React from 'react';
import { ArsenalShell } from './motion-arsenal/components/ArsenalShell';
import { EFFECTS_CATALOG } from './motion-arsenal/data/effectsCatalog';
import NoxCosmicDepthField from './motion-arsenal/effects/backgrounds/NoxCosmicDepthField';

export default function App() {
  return (
    <div className="arsenal-app">
      <div className="arsenal-cosmic-background" aria-hidden="true">
        <NoxCosmicDepthField
          starCount={1400}
          dustCount={450}
          foregroundStarRatio={0.3}
          mediumStarRatio={0}
          backgroundStarRatio={0.7}
          minStarSize={0.45}
          maxStarSize={1.3}
          foregroundMaxSize={2.1}
          dustSize={0.6}
          depthLayers={7}
          perspectiveDepth={1.85}
          nearPlane={0.05}
          farPlane={0.65}
          depthDistribution={0.94}
          atmosphericPerspective={0.72}
          scrollSpeed={0.01}
          scrollParallax={0}
          scrollSmoothing={0.18}
          verticalDrift={0}
          horizontalDrift={0.008}
          velocityInfluence={0.25}
          bloom={0.98}
          glowRadius={1.1}
          glowIntensity={0.24}
          coreBrightness={1.05}
          haloOpacity={0.4}
          depthBlur={0.35}
          backgroundBlur={0.8}
          foregroundBlur={0.6}
          bokehStrength={0.15}
          focusDepth={0.55}
          trailLength={0.08}
          trailOpacity={0.35}
          motionBlur={0.2}
          smear={0.12}
          starOpacity={1}
          dustOpacity={0.28}
          twinkle={0.08}
          colorTemperature={0.35}
          vignette={0.04}
          nebulaOpacity={0.16}
          mobileStarCount={220}
          mobileScrollSpeed={0.04}
          mobileBloom={0.18}
          mobileDpr={1.5}
          seed={20260731}
        />
      </div>
      <div className="arsenal-app-content"><ArsenalShell catalog={EFFECTS_CATALOG} /></div>
    </div>
  );
}
