import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../lib/animationUtils';

// ---------------------------------------------------------------------------
// !!! REFERENCE STUDY — DO NOT SHIP DIRECTLY !!!
// 1:1-nahe Reproduktion der Shopify-Editions-Butterflies-Mechanik:
// InstancedMesh + per-Instance `instanceRandom` Vec4 → Flap-Speed/Amplitude/
// Phase/Asymmetrie, 3 überlagerte Sinuswellen, Fresnel-Edge-Glow mit Puls.
// Quelle: shopify-assets/Butterflies-CFpdR9tM.js:307-390 (Vertex+Fragment).
// Kein Original-Asset übernommen — Flügel sind prozedurale Planes.
// ---------------------------------------------------------------------------

export interface ButterfliesRefProps {
  count?: number;
  glowIntensity?: number;
  speed?: number;
}

const VERT = /* glsl */ `
precision mediump float;
attribute vec4 instanceRandom;
uniform float uTime;
uniform float uScale;
varying vec2 vUv;
varying vec4 vRandom;

void main() {
  vUv = uv;
  vRandom = instanceRandom;
  vec3 pos = position;

  // Extrahierte Referenz-Mechanik (Butterflies-CFpdR9tM.js:307-330):
  float flapSpeed = 4.0 + instanceRandom.y * 4.0;
  float flapAmp = 0.8 + instanceRandom.z * 0.5;
  float phase = instanceRandom.x * 6.28;
  float t = uTime;
  float wave = sin(t * flapSpeed + phase) * flapAmp;
  wave += sin(t * 2.1 + instanceRandom.w * 3.14) * 0.2;
  wave += sin(t * 0.37 + instanceRandom.z * 5.0) * 0.3;
  float asymmetry = 1.0 + sign(pos.x) * sin(t * 0.7 + instanceRandom.w * 6.28) * 0.08;

  // Flap: Flügel klappen um die Y-Achse (x-Anteil hebt sich)
  pos.y += abs(pos.x) * wave * 0.55 * asymmetry;
  pos.x *= 1.0 - abs(wave) * 0.22;
  pos *= uScale * (0.8 + instanceRandom.x * 0.4);

  vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform float uGlowIntensity;
uniform vec3 uColor;
uniform vec3 uGlowColor;
varying vec2 vUv;
varying vec4 vRandom;

void main() {
  // Prozedurale Flügel-Textur (statt Original-Asset)
  float dCenter = length(vUv - 0.5);
  float wing = smoothstep(0.5, 0.42, dCenter);
  float vein = smoothstep(0.02, 0.0, abs(fract(vUv.x * 6.0 + vRandom.x) - 0.5) - 0.42);
  vec3 color = uColor * (0.65 + vRandom.y * 0.5) + vein * 0.15;

  // Extrahierte Referenz-Mechanik (Butterflies:355-389): Fresnel-Edge-Glow + Puls
  float edgeGlow = smoothstep(1.0, 0.0, length(vUv - 0.5)) * uGlowIntensity;
  float pulse = sin(uTime * 2.0 + vRandom.w * 6.28) * 0.5 + 0.5;
  color += uGlowColor * edgeGlow * 0.3 * pulse;
  color = pow(color, vec3(1.5));

  gl_FragColor = vec4(color, wing * 0.95);
  if (gl_FragColor.a < 0.02) discard;
}
`;

export function ReferenceShopifyButterflies({ count = 48, glowIntensity = 1.4, speed = 1 }: ButterfliesRefProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 11;

    const n = Math.max(8, Math.min(96, Math.round(count)));
    const geo = new THREE.PlaneGeometry(1, 0.8, 6, 2);
    const instanceRandom = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) instanceRandom[i] = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    geo.setAttribute('instanceRandom', new THREE.InstancedBufferAttribute(instanceRandom, 4));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uGlowIntensity: { value: glowIntensity },
        uColor: { value: new THREE.Color('#8f4fd6') },
        uGlowColor: { value: new THREE.Color('#39ff8b') },
      },
    });

    const mesh = new THREE.InstancedMesh(geo, mat, n);
    const dummy = new THREE.Object3D();
    const homes: Array<{ x: number; y: number; z: number; r: number; s: number; o: number }> = [];
    for (let i = 0; i < n; i++) {
      const h = {
        x: (instanceRandom[i * 4] - 0.5) * 16,
        y: (instanceRandom[i * 4 + 1] - 0.5) * 9,
        z: (instanceRandom[i * 4 + 2] - 0.5) * 6,
        r: instanceRandom[i * 4 + 3] * Math.PI * 2,
        s: 0.5 + instanceRandom[i * 4 + 1] * 0.7,
        o: instanceRandom[i * 4 + 2] * Math.PI * 2,
      };
      homes.push(h);
    }
    scene.add(mesh);

    const resize = () => {
      const r = mount.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / Math.max(r.height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const start = performance.now();
    const render = () => {
      const t = reduced ? 2.4 : ((performance.now() - start) / 1000) * speed;
      mat.uniforms.uTime.value = t;
      for (let i = 0; i < n; i++) {
        const h = homes[i];
        // Sanfter Drift der Instanzen (Positions-Layer der Referenz via Anime.js — hier Sinus-Drift)
        dummy.position.set(
          h.x + Math.sin(t * 0.3 + h.o) * 1.2,
          h.y + Math.sin(t * 0.22 + h.o * 2.0) * 0.9,
          h.z + Math.cos(t * 0.26 + h.o) * 0.8,
        );
        dummy.rotation.set(Math.sin(t * 0.2 + h.o) * 0.3, h.r + t * 0.05, Math.cos(t * 0.17 + h.o) * 0.2);
        dummy.scale.setScalar(h.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [count, glowIntensity, speed, reduced]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(100% 100% at 50% 100%, #101018 0%, #070708 60%)' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: 'var(--mono, monospace)', fontSize: 9.5, letterSpacing: '0.25em', color: '#6a675f', pointerEvents: 'none' }}>
        REFERENCE STUDY · SHOPIFY BUTTERFLIES INSTANCING — DO NOT SHIP
      </div>
    </div>
  );
}

export default ReferenceShopifyButterflies;
