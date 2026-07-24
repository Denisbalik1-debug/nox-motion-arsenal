import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import {
  createNOXOrbitalStationModel,
  createNOXOrbitalStationLookDevLights,
  createNOXOrbitalStationEnvironment,
  frameNOXOrbitalStationCamera,
} from './NoxOrbitalStationFactory';

// ---------------------------------------------------------------------------
// NoxOrbitalStation — img2threejs blockout pass. Reconstructed from a single
// reference render via the img2threejs skill (github.com/hoainho/img2threejs,
// Apache-2.0): image -> ObjectSculptSpec (16 hand-authored components,
// hard-surface hull/dish/solar-panel/emissive materials) -> generated
// Three.js factory, iterated against the reference until the silhouette
// read correctly. This is the blockout pass — proportions and hierarchy are
// right, materials are still flat placeholders (material-pass would bring
// in the real hull/solar-panel/emissive-ring palette).
//
// "DOWNLOAD .GLB" exports the live scene via THREE.GLTFExporter — the file
// it produces is a genuine asset reusable anywhere that takes glb, unlike this component's source
// (procedural TS code, not a binary you can drag anywhere).
// ---------------------------------------------------------------------------

export function NoxOrbitalStation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const reduced = usePrefersReducedMotion();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);
    scene.environment = createNOXOrbitalStationEnvironment(renderer);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    const model = createNOXOrbitalStationModel({ castShadow: true, receiveShadow: true });
    modelRef.current = model;
    scene.add(model);
    scene.add(createNOXOrbitalStationLookDevLights('neutral'));

    frameNOXOrbitalStationCamera(camera, model, { margin: 1.3, azimuthDeg: 12, elevationDeg: 8 });
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.copy(center);
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.6;

    const resize = () => {
      const w = Math.max(canvas.clientWidth, 1);
      const h = Math.max(canvas.clientHeight, 1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if (reduced) {
      controls.update();
      renderer.render(scene, camera);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      modelRef.current = null;
    };
  }, [reduced]);

  const downloadGlb = () => {
    const model = modelRef.current;
    if (!model || exporting) return;
    setExporting(true);
    const exporter = new GLTFExporter();
    exporter.parse(
      model,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nox-orbital-station.glb';
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[NoxOrbitalStation] GLB export failed:', err);
        setExporting(false);
      },
      { binary: true },
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05060a', touchAction: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.3em', color: NOX_COLORS.textDim, pointerEvents: 'none' }}>
        NOX ORBITAL STATION // BLOCKOUT PASS // DRAG TO ORBIT
      </div>

      <div style={{ position: 'absolute', top: 12, right: 14 }}>
        <button
          onClick={downloadGlb}
          disabled={exporting}
          style={{
            fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.2em',
            color: NOX_COLORS.text, background: 'rgba(212,162,74,0.14)', border: `1px solid ${NOX_COLORS.gold}55`,
            borderRadius: 5, padding: '5px 10px', cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? 'EXPORTING…' : 'DOWNLOAD .GLB'}
        </button>
      </div>
    </div>
  );
}

export default NoxOrbitalStation;
