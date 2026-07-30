import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../lib/animationUtils';

// ---------------------------------------------------------------------------
// !!! REFERENCE STUDY — DO NOT SHIP DIRECTLY !!!
// Reproduktion der Shopify-Editions-CoinRain-Mechanik:
// InstancedMesh (150 Coins, 1 Drawcall), Velocity-Integration
// (vel.y -= gravity*dt; pos += vel*dt), randomisierte Rotationsgeschwindigkeit,
// Respawn oben mit Stagger. Quelle: shopify-assets/CoinRain-BMBoDYha.js.
// Coins sind prozedurale Zylinder — kein Original-Asset.
// ---------------------------------------------------------------------------

export interface CoinRainRefProps {
  count?: number;
  gravity?: number;
  speed?: number;
}

export function ReferenceShopifyCoinRain({ count = 150, gravity = 4, speed = 1 }: CoinRainRefProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffe6b0, 2.2);
    key.position.set(4, 6, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc93030, 1.2);
    rim.position.set(-5, -2, -4);
    scene.add(rim);

    const n = Math.max(20, Math.min(300, Math.round(count)));
    const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.07, 24);
    const mat = new THREE.MeshStandardMaterial({ color: '#d4a24a', metalness: 0.9, roughness: 0.25 });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    scene.add(mesh);

    // Referenz-Mechanik: per-Coin pos/vel/rot + rotSpeed Arrays, Integration pro Frame.
    const rnd = (i: number, k: number) => Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const rot = new Float32Array(n * 3);
    const rotSpeed = new Float32Array(n * 3);
    const respawn = (i: number, initial = false) => {
      pos[i * 3] = (rnd(i, 1) - 0.5) * 18;
      pos[i * 3 + 1] = initial ? (rnd(i, 2) - 0.5) * 24 : 9 + rnd(i, 2) * 8; // Stagger
      pos[i * 3 + 2] = (rnd(i, 3) - 0.5) * 8;
      vel[i * 3] = (rnd(i, 4) - 0.5) * 0.6;
      vel[i * 3 + 1] = -rnd(i, 5) * 1.5;
      vel[i * 3 + 2] = (rnd(i, 6) - 0.5) * 0.3;
      rot[i * 3] = rnd(i, 7) * Math.PI * 2;
      rot[i * 3 + 1] = rnd(i, 8) * Math.PI * 2;
      rot[i * 3 + 2] = rnd(i, 9) * Math.PI * 2;
      rotSpeed[i * 3] = (rnd(i, 10) - 0.5) * 4;
      rotSpeed[i * 3 + 1] = (rnd(i, 11) - 0.5) * 4;
      rotSpeed[i * 3 + 2] = (rnd(i, 12) - 0.5) * 4;
    };
    for (let i = 0; i < n; i++) respawn(i, true);

    const dummy = new THREE.Object3D();
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
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20) * speed;
      last = now;
      for (let i = 0; i < n; i++) {
        // Extrahierte Integration: vel.y -= gravity*dt; pos += vel*dt; rot += rotSpeed*dt
        vel[i * 3 + 1] -= gravity * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        rot[i * 3] += rotSpeed[i * 3] * dt;
        rot[i * 3 + 1] += rotSpeed[i * 3 + 1] * dt;
        rot[i * 3 + 2] += rotSpeed[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < -11) respawn(i);
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.rotation.set(rot[i * 3], rot[i * 3 + 1], rot[i * 3 + 2]);
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
  }, [count, gravity, speed, reduced]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(100% 100% at 50% 0%, #131016 0%, #070708 65%)' }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: 'var(--mono, monospace)', fontSize: 9.5, letterSpacing: '0.25em', color: '#6a675f', pointerEvents: 'none' }}>
        REFERENCE STUDY · SHOPIFY COIN RAIN INSTANCING — DO NOT SHIP
      </div>
    </div>
  );
}

export default ReferenceShopifyCoinRain;
