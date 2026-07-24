import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions): THREE.MeshPhysicalMaterial {
  const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    if (bumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = bumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    if (displacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = displacementScale;
      material.displacementBias = -displacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: NOX Orbital Station
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createNOXOrbitalStationModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "NOX Orbital Station";

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["hull"] = createSculptMaterial(
    "hull",
    {"id": "hull", "name": "Station Hull (matte-semigloss anodized metal)", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#2b2e33", "color": "#2b2e33", "albedo": {"dominant": "#2b2e33", "secondary": ["#1c1e21", "#3d4147"], "samplingNotes": "Dark neutral grey hull, cooler than pure black, slight blue undertone from starlight/rim bounce."}, "colorVariation": {"palette": ["#2b2e33", "#1c1e21", "#3d4147"], "pattern": "panel-line banding", "amplitude": 0.12, "heightCorrelation": 0.4}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2, 4], "anisotropy": 8, "texelDensityIntent": "Stable panel-line scale across all spine/hub cylinders."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.5, "amplitude": 0.3, "role": "broad hull panel breakup"}, {"id": "meso", "frequency": 10.0, "amplitude": 0.2, "role": "horizontal panel-line ribs / hullPanelSeams"}, {"id": "micro", "frequency": 40.0, "amplitude": 0.06, "role": "brushed-metal highlight breakup"}], "roughness": {"base": 0.55, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "lower roughness on panel-line edges, higher in recesses"}, "metalness": {"base": 0.65, "variation": 0.1}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.4, "scale": 18, "space": "tangent"}, "bump": {"pattern": "ribbed-panel-lines", "amplitude": 0.12, "scale": 10}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.35, "contactShadowBias": 0.4, "notes": "Darken panel-line seams and module joints."}, "wear": {"edgeWear": 0.2, "scratches": [], "chips": []}, "dirt": {"amount": 0.05, "cavityBias": 0.3, "color": "#15161a"}, "localOverrides": [], "shaderNotes": ["Cool dark hull, metalness-forward so starlight rims read correctly."], "notes": "Primary hull material across hub and spine segments."},
    options
  );
  materialMap["hull-dark"] = createSculptMaterial(
    "hull-dark",
    {"id": "hull-dark", "name": "Hull Dark Accent (mast/boom/docking hardware)", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#16171a", "color": "#16171a", "albedo": {"dominant": "#16171a", "secondary": ["#0d0e10"], "samplingNotes": "Near-black hardware tone for thin mast/boom elements."}, "colorVariation": {"palette": ["#16171a", "#0d0e10"], "pattern": "solid", "amplitude": 0.05, "heightCorrelation": 0.1}, "textureResolution": 512, "textureProjection": {"mode": "uv", "repeat": [1, 1], "anisotropy": 4, "texelDensityIntent": "Small thin parts, low-frequency detail only."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.0, "amplitude": 0.15, "role": "flat dark base"}, {"id": "meso", "frequency": 6.0, "amplitude": 0.08, "role": "minor surface variation"}, {"id": "micro", "frequency": 24.0, "amplitude": 0.03, "role": "specular breakup"}], "roughness": {"base": 0.4, "variation": 0.08, "map": "independent-procedural-field", "localResponse": "uniform"}, "metalness": {"base": 0.75, "variation": 0.05}, "normal": {"pattern": "flat-with-minor-noise", "strength": 0.15, "scale": 8, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.2, "contactShadowBias": 0.3, "notes": "Minimal, small parts."}, "wear": {"edgeWear": 0.1, "scratches": [], "chips": []}, "dirt": {"amount": 0.02, "cavityBias": 0.2, "color": "#0a0a0c"}, "localOverrides": [], "shaderNotes": ["Slightly darker+glossier than hull for mast/boom/dock read as distinct hardware."], "notes": "Mast, dish boom, docking node accent material."},
    options
  );
  materialMap["ring-emissive"] = createSculptMaterial(
    "ring-emissive",
    {"id": "ring-emissive", "name": "Joint Ring Light (blue emissive)", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#1a3a5c", "color": "#1a3a5c", "albedo": {"dominant": "#66c8ff", "secondary": ["#1a3a5c"], "samplingNotes": "Bright cyan-blue emissive core over a dark housing base."}, "colorVariation": {"palette": ["#66c8ff", "#1a3a5c"], "pattern": "solid-emissive", "amplitude": 0.0, "heightCorrelation": 0.0}, "textureResolution": 256, "textureProjection": {"mode": "uv", "repeat": [1, 1], "anisotropy": 1, "texelDensityIntent": "Thin emissive band, no texture detail needed."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.0, "amplitude": 0.1, "role": "even emissive glow"}], "roughness": {"base": 0.3, "variation": 0.0, "map": "flat", "localResponse": "none"}, "metalness": {"base": 0.1, "variation": 0.0}, "normal": {"pattern": "flat", "strength": 0.0, "scale": 1, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.0, "contactShadowBias": 0.0, "notes": "Emissive, unaffected by AO."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#000000"}, "localOverrides": [], "shaderNotes": ["emissive: '#66c8ff', emissiveIntensity ~2.2 — this is the identity blue glow ring seen at every module joint."], "notes": "Hub and bottom-cap ring lights."},
    options
  );
  materialMap["dish"] = createSculptMaterial(
    "dish",
    {"id": "dish", "name": "Dish Antenna Surface", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#4a4d52", "color": "#4a4d52", "albedo": {"dominant": "#4a4d52", "secondary": ["#3a3d42"], "samplingNotes": "Lighter grey than hull, brushed-metal dish surface."}, "colorVariation": {"palette": ["#4a4d52", "#3a3d42"], "pattern": "radial-brushed", "amplitude": 0.1, "heightCorrelation": 0.2}, "textureResolution": 512, "textureProjection": {"mode": "uv", "repeat": [1, 1], "anisotropy": 8, "texelDensityIntent": "Radial brushed-metal look on the concave dish face."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.0, "amplitude": 0.15, "role": "concave shading gradient"}, {"id": "meso", "frequency": 8.0, "amplitude": 0.1, "role": "radial brush lines"}], "roughness": {"base": 0.35, "variation": 0.1, "map": "independent-procedural-field", "localResponse": "lower roughness catches rim highlight"}, "metalness": {"base": 0.8, "variation": 0.05}, "normal": {"pattern": "radial-brushed-metal", "strength": 0.2, "scale": 30, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.3, "contactShadowBias": 0.3, "notes": "Darken the dish rim/boom joint."}, "wear": {"edgeWear": 0.15, "scratches": [], "chips": []}, "dirt": {"amount": 0.03, "cavityBias": 0.2, "color": "#1a1a1c"}, "localOverrides": [], "shaderNotes": ["Higher metalness+specular than hull; reads as a reflective dish, not painted hull."], "notes": "Parabolic dish antenna."},
    options
  );
  materialMap["solar-panel"] = createSculptMaterial(
    "solar-panel",
    {"id": "solar-panel", "name": "Solar Panel Array", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#0c1420", "color": "#0c1420", "albedo": {"dominant": "#0c1420", "secondary": ["#16324a", "#050a10"], "samplingNotes": "Very dark blue-black cell surface with a subtle grid of lighter seam lines."}, "colorVariation": {"palette": ["#0c1420", "#16324a", "#050a10"], "pattern": "regular-grid", "amplitude": 0.25, "heightCorrelation": 0.15}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [6, 3], "anisotropy": 8, "texelDensityIntent": "Regular solar-cell grid tiling along the panel's long axis."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.2, "role": "panel-to-panel color breakup"}, {"id": "meso", "frequency": 18.0, "amplitude": 0.3, "role": "solar-cell grid seams (solarPanelGrid detail)"}, {"id": "micro", "frequency": 60.0, "amplitude": 0.1, "role": "cell surface sparkle/anisotropic highlight"}], "roughness": {"base": 0.25, "variation": 0.1, "map": "independent-procedural-field", "localResponse": "lower roughness on cell surface, higher on grid seams"}, "metalness": {"base": 0.2, "variation": 0.05}, "normal": {"pattern": "grid-seam-relief", "strength": 0.5, "scale": 20, "space": "tangent"}, "bump": {"pattern": "cell-grid", "amplitude": 0.08, "scale": 18}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.3, "contactShadowBias": 0.35, "notes": "Darken grid seams between cells."}, "wear": {"edgeWear": 0.1, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#000000"}, "localOverrides": [], "shaderNotes": ["Low roughness + slight blue tint reads as glass-covered photovoltaic cells, distinct from the matte hull."], "notes": "All four solar arm panels share this material."},
    options
  );
  materialMap["decal"] = createSculptMaterial(
    "decal",
    {"id": "decal", "name": "NOX Wordmark Decal", "type": "standard", "shaderModel": "MeshStandardMaterial", "baseColor": "#f0ece4", "color": "#f0ece4", "albedo": {"dominant": "#f0ece4", "secondary": ["#d8d4cc"], "samplingNotes": "Clean off-white printed wordmark on the hub hull."}, "colorVariation": {"palette": ["#f0ece4"], "pattern": "solid", "amplitude": 0.0, "heightCorrelation": 0.0}, "textureResolution": 512, "textureProjection": {"mode": "uv", "repeat": [1, 1], "anisotropy": 4, "texelDensityIntent": "Decal-space UVs on the hub front face only."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 1.0, "amplitude": 0.05, "role": "flat print"}], "roughness": {"base": 0.5, "variation": 0.05, "map": "flat", "localResponse": "none"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "flat", "strength": 0.0, "scale": 1, "space": "tangent"}, "bump": {"pattern": "none", "amplitude": 0, "scale": 1}, "displacement": {"pattern": "none", "amplitude": 0, "scale": 1, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.0, "contactShadowBias": 0.0, "notes": "Flat decal, no relief."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#000000"}, "localOverrides": [], "shaderNotes": ["Rendered as a canvas-texture decal on the hub front face in the material-pass, not a separate mesh."], "notes": "NOX wordmark; implemented via CanvasTexture in material-pass, placeholder flat color for blockout."},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const attachment_hub_0 = null;
  const endpoint_hub_0 = makeAttachmentEndpoint(attachment_hub_0);
  const node_hub_0 = new THREE.Group();
  node_hub_0.name = "Central Hub Module__pivot";
  if (endpoint_hub_0) {
    node_hub_0.position.copy(endpoint_hub_0.start);
    node_hub_0.rotation.set(0, 0, 0);
    node_hub_0.scale.set(1, 1, 1);
  } else {
    node_hub_0.position.set(0.0, 0.0, 0.0);
    node_hub_0.rotation.set(0.0, 0.0, 0.0);
    node_hub_0.scale.set(0.68, 0.55, 0.68);
  }
  node_hub_0.userData.sculptComponent = {"id": "hub", "name": "Central Hub Module", "level": "macro", "role": "root", "importance": 1.0, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Central Hub Module decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.68, "height": 0.55, "depth": 0.68, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull", "decal"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "hub-decal", "desc": "white NOX wordmark decal on hull, front-facing"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": null, "attachment": null, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [0.68, 0.55, 0.68]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cylinder", "offset": [0, 0, 0], "scale": [0.34, 0.275, 0.34], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_hub_0.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cylinder", "offset": [0, 0, 0], "scale": [0.34, 0.275, 0.34], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["root"] ?? root).add(node_hub_0);
  nodes["hub"] = node_hub_0;
  const mesh_hub_0Geometry = endpoint_hub_0
    ? new THREE.CylinderGeometry(endpoint_hub_0.endRadius, endpoint_hub_0.baseRadius, endpoint_hub_0.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_hub_0 = new THREE.Mesh(
    mesh_hub_0Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_hub_0.name = "Central Hub Module";
  if (endpoint_hub_0) {
    mesh_hub_0.position.copy(endpoint_hub_0.midpoint);
    mesh_hub_0.quaternion.copy(endpoint_hub_0.quaternion);
  }
  mesh_hub_0.castShadow = options.castShadow ?? true;
  mesh_hub_0.receiveShadow = options.receiveShadow ?? true;
  mesh_hub_0.userData.sculptComponent = {"id": "hub", "name": "Central Hub Module", "level": "macro", "role": "root", "importance": 1.0, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Central Hub Module decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.68, "height": 0.55, "depth": 0.68, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull", "decal"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "hub-decal", "desc": "white NOX wordmark decal on hull, front-facing"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": null, "attachment": null, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [0.68, 0.55, 0.68]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cylinder", "offset": [0, 0, 0], "scale": [0.34, 0.275, 0.34], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_hub_0.add(mesh_hub_0);
  meshes["hub"] = mesh_hub_0;
  colliders["hub"] = {"type": "cylinder", "offset": [0, 0, 0], "scale": [0.34, 0.275, 0.34], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_hub_0);

  const attachment_hub_ring_1 = null;
  const endpoint_hub_ring_1 = makeAttachmentEndpoint(attachment_hub_ring_1);
  const node_hub_ring_1 = new THREE.Group();
  node_hub_ring_1.name = "Hub Joint Ring Light__pivot";
  if (endpoint_hub_ring_1) {
    node_hub_ring_1.position.copy(endpoint_hub_ring_1.start);
    node_hub_ring_1.rotation.set(0, 0, 0);
    node_hub_ring_1.scale.set(1, 1, 1);
  } else {
    node_hub_ring_1.position.set(0.0, 0.275, 0.0);
    node_hub_ring_1.rotation.set(1.5707963267948966, 0.0, 0.0);
    node_hub_ring_1.scale.set(0.42, 0.06, 0.42);
  }
  node_hub_ring_1.userData.sculptComponent = {"id": "hub-ring", "name": "Hub Joint Ring Light", "level": "meso", "role": "support", "importance": 0.5, "confidence": 0.6, "primitive": "torus", "topologyClass": "assembled-solid", "topologyRationale": "Hub Joint Ring Light decomposed from the reference as a torus primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry", "torusTubeRatio": 0.14}, "dimensions": {"width": 0.42, "height": 0.06, "depth": 0.42, "units": "relative", "confidence": 0.6}, "material": "ring-emissive", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0, 0.275, 0], "rotation": [1.5707963267948966, 0, 0], "scale": [0.42, 0.06, 0.42]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_hub_ring_1.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_hub_ring_1);
  nodes["hub-ring"] = node_hub_ring_1;
  const mesh_hub_ring_1Geometry = endpoint_hub_ring_1
    ? new THREE.CylinderGeometry(endpoint_hub_ring_1.endRadius, endpoint_hub_ring_1.baseRadius, endpoint_hub_ring_1.length, 32, 12)
    : new THREE.TorusGeometry(0.45, 0.063, 24, 96);
  const mesh_hub_ring_1 = new THREE.Mesh(
    mesh_hub_ring_1Geometry,
    materialMap["ring-emissive"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_hub_ring_1.name = "Hub Joint Ring Light";
  if (endpoint_hub_ring_1) {
    mesh_hub_ring_1.position.copy(endpoint_hub_ring_1.midpoint);
    mesh_hub_ring_1.quaternion.copy(endpoint_hub_ring_1.quaternion);
  }
  mesh_hub_ring_1.castShadow = options.castShadow ?? true;
  mesh_hub_ring_1.receiveShadow = options.receiveShadow ?? true;
  mesh_hub_ring_1.userData.sculptComponent = {"id": "hub-ring", "name": "Hub Joint Ring Light", "level": "meso", "role": "support", "importance": 0.5, "confidence": 0.6, "primitive": "torus", "topologyClass": "assembled-solid", "topologyRationale": "Hub Joint Ring Light decomposed from the reference as a torus primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry", "torusTubeRatio": 0.14}, "dimensions": {"width": 0.42, "height": 0.06, "depth": 0.42, "units": "relative", "confidence": 0.6}, "material": "ring-emissive", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0, 0.275, 0], "rotation": [1.5707963267948966, 0, 0], "scale": [0.42, 0.06, 0.42]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_hub_ring_1.add(mesh_hub_ring_1);
  meshes["hub-ring"] = mesh_hub_ring_1;
  colliders["hub-ring"] = {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_hub_ring_1);

  const attachment_spine_upper_a_2 = {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, 0.275, 0], "localEnd": [0.0, 0.895, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_spine_upper_a_2 = makeAttachmentEndpoint(attachment_spine_upper_a_2);
  const node_spine_upper_a_2 = new THREE.Group();
  node_spine_upper_a_2.name = "Upper Spine Segment A__pivot";
  if (endpoint_spine_upper_a_2) {
    node_spine_upper_a_2.position.copy(endpoint_spine_upper_a_2.start);
    node_spine_upper_a_2.rotation.set(0, 0, 0);
    node_spine_upper_a_2.scale.set(1, 1, 1);
  } else {
    node_spine_upper_a_2.position.set(0.0, 0.275, 0.0);
    node_spine_upper_a_2.rotation.set(0.0, 0.0, 0.0);
    node_spine_upper_a_2.scale.set(0.6, 0.62, 0.6);
  }
  node_spine_upper_a_2.userData.sculptComponent = {"id": "spine-upper-a", "name": "Upper Spine Segment A", "level": "meso", "role": "connector", "importance": 0.8, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Upper Spine Segment A decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.6, "height": 0.62, "depth": 0.6, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, 0.275, 0], "localEnd": [0.0, 0.895, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.275, 0], "rotation": [0, 0, 0], "scale": [0.6, 0.62, 0.6]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.31, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_upper_a_2.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.31, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_spine_upper_a_2);
  nodes["spine-upper-a"] = node_spine_upper_a_2;
  const mesh_spine_upper_a_2Geometry = endpoint_spine_upper_a_2
    ? new THREE.CylinderGeometry(endpoint_spine_upper_a_2.endRadius, endpoint_spine_upper_a_2.baseRadius, endpoint_spine_upper_a_2.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_spine_upper_a_2 = new THREE.Mesh(
    mesh_spine_upper_a_2Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_spine_upper_a_2.name = "Upper Spine Segment A";
  if (endpoint_spine_upper_a_2) {
    mesh_spine_upper_a_2.position.copy(endpoint_spine_upper_a_2.midpoint);
    mesh_spine_upper_a_2.quaternion.copy(endpoint_spine_upper_a_2.quaternion);
  }
  mesh_spine_upper_a_2.castShadow = options.castShadow ?? true;
  mesh_spine_upper_a_2.receiveShadow = options.receiveShadow ?? true;
  mesh_spine_upper_a_2.userData.sculptComponent = {"id": "spine-upper-a", "name": "Upper Spine Segment A", "level": "meso", "role": "connector", "importance": 0.8, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Upper Spine Segment A decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.6, "height": 0.62, "depth": 0.6, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, 0.275, 0], "localEnd": [0.0, 0.895, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.275, 0], "rotation": [0, 0, 0], "scale": [0.6, 0.62, 0.6]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.31, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_upper_a_2.add(mesh_spine_upper_a_2);
  meshes["spine-upper-a"] = mesh_spine_upper_a_2;
  colliders["spine-upper-a"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.31, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_spine_upper_a_2);

  const attachment_spine_upper_b_3 = {"parentId": "spine-upper-a", "parentSocket": "spine-upper-a-far-end", "localStart": [0, 0.62, 0], "localEnd": [0.0, 1.12, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_spine_upper_b_3 = makeAttachmentEndpoint(attachment_spine_upper_b_3);
  const node_spine_upper_b_3 = new THREE.Group();
  node_spine_upper_b_3.name = "Upper Spine Segment B__pivot";
  if (endpoint_spine_upper_b_3) {
    node_spine_upper_b_3.position.copy(endpoint_spine_upper_b_3.start);
    node_spine_upper_b_3.rotation.set(0, 0, 0);
    node_spine_upper_b_3.scale.set(1, 1, 1);
  } else {
    node_spine_upper_b_3.position.set(0.0, 0.62, 0.0);
    node_spine_upper_b_3.rotation.set(0.0, 0.0, 0.0);
    node_spine_upper_b_3.scale.set(0.4, 0.5, 0.4);
  }
  node_spine_upper_b_3.userData.sculptComponent = {"id": "spine-upper-b", "name": "Upper Spine Segment B", "level": "meso", "role": "connector", "importance": 0.6, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Upper Spine Segment B decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.4, "height": 0.5, "depth": 0.4, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "spine-upper-a", "attachment": {"parentId": "spine-upper-a", "parentSocket": "spine-upper-a-far-end", "localStart": [0, 0.62, 0], "localEnd": [0.0, 1.12, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 0, 0], "scale": [0.4, 0.5, 0.4]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.25, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_upper_b_3.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.25, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["spine-upper-a"] ?? root).add(node_spine_upper_b_3);
  nodes["spine-upper-b"] = node_spine_upper_b_3;
  const mesh_spine_upper_b_3Geometry = endpoint_spine_upper_b_3
    ? new THREE.CylinderGeometry(endpoint_spine_upper_b_3.endRadius, endpoint_spine_upper_b_3.baseRadius, endpoint_spine_upper_b_3.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_spine_upper_b_3 = new THREE.Mesh(
    mesh_spine_upper_b_3Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_spine_upper_b_3.name = "Upper Spine Segment B";
  if (endpoint_spine_upper_b_3) {
    mesh_spine_upper_b_3.position.copy(endpoint_spine_upper_b_3.midpoint);
    mesh_spine_upper_b_3.quaternion.copy(endpoint_spine_upper_b_3.quaternion);
  }
  mesh_spine_upper_b_3.castShadow = options.castShadow ?? true;
  mesh_spine_upper_b_3.receiveShadow = options.receiveShadow ?? true;
  mesh_spine_upper_b_3.userData.sculptComponent = {"id": "spine-upper-b", "name": "Upper Spine Segment B", "level": "meso", "role": "connector", "importance": 0.6, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Upper Spine Segment B decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.4, "height": 0.5, "depth": 0.4, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "spine-upper-a", "attachment": {"parentId": "spine-upper-a", "parentSocket": "spine-upper-a-far-end", "localStart": [0, 0.62, 0], "localEnd": [0.0, 1.12, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.62, 0], "rotation": [0, 0, 0], "scale": [0.4, 0.5, 0.4]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.25, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_upper_b_3.add(mesh_spine_upper_b_3);
  meshes["spine-upper-b"] = mesh_spine_upper_b_3;
  colliders["spine-upper-b"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.25, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_spine_upper_b_3);

  const attachment_mast_4 = {"parentId": "spine-upper-b", "parentSocket": "spine-upper-b-far-end", "localStart": [0, 0.5, 0], "localEnd": [0.0, 1.0, 0.0], "baseRadius": 0.03, "endRadius": 0.025, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_mast_4 = makeAttachmentEndpoint(attachment_mast_4);
  const node_mast_4 = new THREE.Group();
  node_mast_4.name = "Antenna Mast__pivot";
  if (endpoint_mast_4) {
    node_mast_4.position.copy(endpoint_mast_4.start);
    node_mast_4.rotation.set(0, 0, 0);
    node_mast_4.scale.set(1, 1, 1);
  } else {
    node_mast_4.position.set(0.0, 0.5, 0.0);
    node_mast_4.rotation.set(0.0, 0.0, 0.0);
    node_mast_4.scale.set(0.06, 0.5, 0.06);
  }
  node_mast_4.userData.sculptComponent = {"id": "mast", "name": "Antenna Mast", "level": "micro", "role": "pipe", "importance": 0.35, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Antenna Mast decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.06, "height": 0.5, "depth": 0.06, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "spine-upper-b", "attachment": {"parentId": "spine-upper-b", "parentSocket": "spine-upper-b-far-end", "localStart": [0, 0.5, 0], "localEnd": [0.0, 1.0, 0.0], "baseRadius": 0.03, "endRadius": 0.025, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.5, 0], "rotation": [0, 0, 0], "scale": [0.06, 0.5, 0.06]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.03, 0.25, 0.03], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_mast_4.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.03, 0.25, 0.03], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["spine-upper-b"] ?? root).add(node_mast_4);
  nodes["mast"] = node_mast_4;
  const mesh_mast_4Geometry = endpoint_mast_4
    ? new THREE.CylinderGeometry(endpoint_mast_4.endRadius, endpoint_mast_4.baseRadius, endpoint_mast_4.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_mast_4 = new THREE.Mesh(
    mesh_mast_4Geometry,
    materialMap["hull-dark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_mast_4.name = "Antenna Mast";
  if (endpoint_mast_4) {
    mesh_mast_4.position.copy(endpoint_mast_4.midpoint);
    mesh_mast_4.quaternion.copy(endpoint_mast_4.quaternion);
  }
  mesh_mast_4.castShadow = options.castShadow ?? true;
  mesh_mast_4.receiveShadow = options.receiveShadow ?? true;
  mesh_mast_4.userData.sculptComponent = {"id": "mast", "name": "Antenna Mast", "level": "micro", "role": "pipe", "importance": 0.35, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Antenna Mast decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.06, "height": 0.5, "depth": 0.06, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "spine-upper-b", "attachment": {"parentId": "spine-upper-b", "parentSocket": "spine-upper-b-far-end", "localStart": [0, 0.5, 0], "localEnd": [0.0, 1.0, 0.0], "baseRadius": 0.03, "endRadius": 0.025, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, 0.5, 0], "rotation": [0, 0, 0], "scale": [0.06, 0.5, 0.06]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.03, 0.25, 0.03], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_mast_4.add(mesh_mast_4);
  meshes["mast"] = mesh_mast_4;
  colliders["mast"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.03, 0.25, 0.03], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_mast_4);

  const attachment_mast_tip_5 = null;
  const endpoint_mast_tip_5 = makeAttachmentEndpoint(attachment_mast_tip_5);
  const node_mast_tip_5 = new THREE.Group();
  node_mast_tip_5.name = "Mast Tip Sphere__pivot";
  if (endpoint_mast_tip_5) {
    node_mast_tip_5.position.copy(endpoint_mast_tip_5.start);
    node_mast_tip_5.rotation.set(0, 0, 0);
    node_mast_tip_5.scale.set(1, 1, 1);
  } else {
    node_mast_tip_5.position.set(0.0, 0.5, 0.0);
    node_mast_tip_5.rotation.set(0.0, 0.0, 0.0);
    node_mast_tip_5.scale.set(0.09, 0.09, 0.09);
  }
  node_mast_tip_5.userData.sculptComponent = {"id": "mast-tip", "name": "Mast Tip Sphere", "level": "micro", "role": "connector", "importance": 0.25, "confidence": 0.6, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "Mast Tip Sphere decomposed from the reference as a sphere primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.09, "height": 0.09, "depth": 0.09, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "mast", "attachment": null, "transform": {"position": [0, 0.5, 0], "rotation": [0, 0, 0], "scale": [0.09, 0.09, 0.09]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [0.045, 0.045, 0.045], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_mast_tip_5.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [0.045, 0.045, 0.045], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["mast"] ?? root).add(node_mast_tip_5);
  nodes["mast-tip"] = node_mast_tip_5;
  const mesh_mast_tip_5Geometry = endpoint_mast_tip_5
    ? new THREE.CylinderGeometry(endpoint_mast_tip_5.endRadius, endpoint_mast_tip_5.baseRadius, endpoint_mast_tip_5.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  const mesh_mast_tip_5 = new THREE.Mesh(
    mesh_mast_tip_5Geometry,
    materialMap["hull-dark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_mast_tip_5.name = "Mast Tip Sphere";
  if (endpoint_mast_tip_5) {
    mesh_mast_tip_5.position.copy(endpoint_mast_tip_5.midpoint);
    mesh_mast_tip_5.quaternion.copy(endpoint_mast_tip_5.quaternion);
  }
  mesh_mast_tip_5.castShadow = options.castShadow ?? true;
  mesh_mast_tip_5.receiveShadow = options.receiveShadow ?? true;
  mesh_mast_tip_5.userData.sculptComponent = {"id": "mast-tip", "name": "Mast Tip Sphere", "level": "micro", "role": "connector", "importance": 0.25, "confidence": 0.6, "primitive": "sphere", "topologyClass": "assembled-solid", "topologyRationale": "Mast Tip Sphere decomposed from the reference as a sphere primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.09, "height": 0.09, "depth": 0.09, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "mast", "attachment": null, "transform": {"position": [0, 0.5, 0], "rotation": [0, 0, 0], "scale": [0.09, 0.09, 0.09]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "sphere", "offset": [0, 0, 0], "scale": [0.045, 0.045, 0.045], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_mast_tip_5.add(mesh_mast_tip_5);
  meshes["mast-tip"] = mesh_mast_tip_5;
  colliders["mast-tip"] = {"type": "sphere", "offset": [0, 0, 0], "scale": [0.045, 0.045, 0.045], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_mast_tip_5);

  const attachment_spine_lower_a_6 = {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.275, 0], "localEnd": [0.0, -0.875, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_spine_lower_a_6 = makeAttachmentEndpoint(attachment_spine_lower_a_6);
  const node_spine_lower_a_6 = new THREE.Group();
  node_spine_lower_a_6.name = "Lower Spine Segment A__pivot";
  if (endpoint_spine_lower_a_6) {
    node_spine_lower_a_6.position.copy(endpoint_spine_lower_a_6.start);
    node_spine_lower_a_6.rotation.set(0, 0, 0);
    node_spine_lower_a_6.scale.set(1, 1, 1);
  } else {
    node_spine_lower_a_6.position.set(0.0, -0.275, 0.0);
    node_spine_lower_a_6.rotation.set(0.0, 0.0, 0.0);
    node_spine_lower_a_6.scale.set(0.6, 0.6, 0.6);
  }
  node_spine_lower_a_6.userData.sculptComponent = {"id": "spine-lower-a", "name": "Lower Spine Segment A", "level": "meso", "role": "connector", "importance": 0.8, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Lower Spine Segment A decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.6, "height": 0.6, "depth": 0.6, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.275, 0], "localEnd": [0.0, -0.875, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, -0.275, 0], "rotation": [0, 0, 0], "scale": [0.6, 0.6, 0.6]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.3, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_lower_a_6.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.3, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_spine_lower_a_6);
  nodes["spine-lower-a"] = node_spine_lower_a_6;
  const mesh_spine_lower_a_6Geometry = endpoint_spine_lower_a_6
    ? new THREE.CylinderGeometry(endpoint_spine_lower_a_6.endRadius, endpoint_spine_lower_a_6.baseRadius, endpoint_spine_lower_a_6.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_spine_lower_a_6 = new THREE.Mesh(
    mesh_spine_lower_a_6Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_spine_lower_a_6.name = "Lower Spine Segment A";
  if (endpoint_spine_lower_a_6) {
    mesh_spine_lower_a_6.position.copy(endpoint_spine_lower_a_6.midpoint);
    mesh_spine_lower_a_6.quaternion.copy(endpoint_spine_lower_a_6.quaternion);
  }
  mesh_spine_lower_a_6.castShadow = options.castShadow ?? true;
  mesh_spine_lower_a_6.receiveShadow = options.receiveShadow ?? true;
  mesh_spine_lower_a_6.userData.sculptComponent = {"id": "spine-lower-a", "name": "Lower Spine Segment A", "level": "meso", "role": "connector", "importance": 0.8, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Lower Spine Segment A decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.6, "height": 0.6, "depth": 0.6, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.275, 0], "localEnd": [0.0, -0.875, 0.0], "baseRadius": 0.3, "endRadius": 0.2, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, -0.275, 0], "rotation": [0, 0, 0], "scale": [0.6, 0.6, 0.6]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.3, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_lower_a_6.add(mesh_spine_lower_a_6);
  meshes["spine-lower-a"] = mesh_spine_lower_a_6;
  colliders["spine-lower-a"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.3, 0.3, 0.3], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_spine_lower_a_6);

  const attachment_spine_lower_b_7 = {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.875, 0], "localEnd": [0.0, -1.335, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_spine_lower_b_7 = makeAttachmentEndpoint(attachment_spine_lower_b_7);
  const node_spine_lower_b_7 = new THREE.Group();
  node_spine_lower_b_7.name = "Lower Spine Segment B__pivot";
  if (endpoint_spine_lower_b_7) {
    node_spine_lower_b_7.position.copy(endpoint_spine_lower_b_7.start);
    node_spine_lower_b_7.rotation.set(0, 0, 0);
    node_spine_lower_b_7.scale.set(1, 1, 1);
  } else {
    node_spine_lower_b_7.position.set(0.0, -0.875, 0.0);
    node_spine_lower_b_7.rotation.set(0.0, 0.0, 0.0);
    node_spine_lower_b_7.scale.set(0.4, 0.46, 0.4);
  }
  node_spine_lower_b_7.userData.sculptComponent = {"id": "spine-lower-b", "name": "Lower Spine Segment B", "level": "meso", "role": "connector", "importance": 0.6, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Lower Spine Segment B decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.4, "height": 0.46, "depth": 0.4, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.875, 0], "localEnd": [0.0, -1.335, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, -0.875, 0], "rotation": [0, 0, 0], "scale": [0.4, 0.46, 0.4]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.23, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_lower_b_7.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.23, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_spine_lower_b_7);
  nodes["spine-lower-b"] = node_spine_lower_b_7;
  const mesh_spine_lower_b_7Geometry = endpoint_spine_lower_b_7
    ? new THREE.CylinderGeometry(endpoint_spine_lower_b_7.endRadius, endpoint_spine_lower_b_7.baseRadius, endpoint_spine_lower_b_7.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_spine_lower_b_7 = new THREE.Mesh(
    mesh_spine_lower_b_7Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_spine_lower_b_7.name = "Lower Spine Segment B";
  if (endpoint_spine_lower_b_7) {
    mesh_spine_lower_b_7.position.copy(endpoint_spine_lower_b_7.midpoint);
    mesh_spine_lower_b_7.quaternion.copy(endpoint_spine_lower_b_7.quaternion);
  }
  mesh_spine_lower_b_7.castShadow = options.castShadow ?? true;
  mesh_spine_lower_b_7.receiveShadow = options.receiveShadow ?? true;
  mesh_spine_lower_b_7.userData.sculptComponent = {"id": "spine-lower-b", "name": "Lower Spine Segment B", "level": "meso", "role": "connector", "importance": 0.6, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Lower Spine Segment B decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.4, "height": 0.46, "depth": 0.4, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0, -0.875, 0], "localEnd": [0.0, -1.335, 0.0], "baseRadius": 0.2, "endRadius": 0.14, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0, -0.875, 0], "rotation": [0, 0, 0], "scale": [0.4, 0.46, 0.4]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.23, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_spine_lower_b_7.add(mesh_spine_lower_b_7);
  meshes["spine-lower-b"] = mesh_spine_lower_b_7;
  colliders["spine-lower-b"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.2, 0.23, 0.2], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_spine_lower_b_7);

  const attachment_bottom_ring_8 = null;
  const endpoint_bottom_ring_8 = makeAttachmentEndpoint(attachment_bottom_ring_8);
  const node_bottom_ring_8 = new THREE.Group();
  node_bottom_ring_8.name = "Bottom Cap Ring Light__pivot";
  if (endpoint_bottom_ring_8) {
    node_bottom_ring_8.position.copy(endpoint_bottom_ring_8.start);
    node_bottom_ring_8.rotation.set(0, 0, 0);
    node_bottom_ring_8.scale.set(1, 1, 1);
  } else {
    node_bottom_ring_8.position.set(0.0, -1.335, 0.0);
    node_bottom_ring_8.rotation.set(1.5707963267948966, 0.0, 0.0);
    node_bottom_ring_8.scale.set(0.36, 0.05, 0.36);
  }
  node_bottom_ring_8.userData.sculptComponent = {"id": "bottom-ring", "name": "Bottom Cap Ring Light", "level": "meso", "role": "support", "importance": 0.4, "confidence": 0.6, "primitive": "torus", "topologyClass": "assembled-solid", "topologyRationale": "Bottom Cap Ring Light decomposed from the reference as a torus primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry", "torusTubeRatio": 0.14}, "dimensions": {"width": 0.36, "height": 0.05, "depth": 0.36, "units": "relative", "confidence": 0.6}, "material": "ring-emissive", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0, -1.335, 0], "rotation": [1.5707963267948966, 0, 0], "scale": [0.36, 0.05, 0.36]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_bottom_ring_8.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_bottom_ring_8);
  nodes["bottom-ring"] = node_bottom_ring_8;
  const mesh_bottom_ring_8Geometry = endpoint_bottom_ring_8
    ? new THREE.CylinderGeometry(endpoint_bottom_ring_8.endRadius, endpoint_bottom_ring_8.baseRadius, endpoint_bottom_ring_8.length, 32, 12)
    : new THREE.TorusGeometry(0.45, 0.063, 24, 96);
  const mesh_bottom_ring_8 = new THREE.Mesh(
    mesh_bottom_ring_8Geometry,
    materialMap["ring-emissive"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_bottom_ring_8.name = "Bottom Cap Ring Light";
  if (endpoint_bottom_ring_8) {
    mesh_bottom_ring_8.position.copy(endpoint_bottom_ring_8.midpoint);
    mesh_bottom_ring_8.quaternion.copy(endpoint_bottom_ring_8.quaternion);
  }
  mesh_bottom_ring_8.castShadow = options.castShadow ?? true;
  mesh_bottom_ring_8.receiveShadow = options.receiveShadow ?? true;
  mesh_bottom_ring_8.userData.sculptComponent = {"id": "bottom-ring", "name": "Bottom Cap Ring Light", "level": "meso", "role": "support", "importance": 0.4, "confidence": 0.6, "primitive": "torus", "topologyClass": "assembled-solid", "topologyRationale": "Bottom Cap Ring Light decomposed from the reference as a torus primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry", "torusTubeRatio": 0.14}, "dimensions": {"width": 0.36, "height": 0.05, "depth": 0.36, "units": "relative", "confidence": 0.6}, "material": "ring-emissive", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0, -1.335, 0], "rotation": [1.5707963267948966, 0, 0], "scale": [0.36, 0.05, 0.36]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_bottom_ring_8.add(mesh_bottom_ring_8);
  meshes["bottom-ring"] = mesh_bottom_ring_8;
  colliders["bottom-ring"] = {"type": "torus", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_bottom_ring_8);

  const attachment_dish_boom_9 = {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [-0.34, 0.05, 0], "localEnd": [-0.8400000000000001, 0.05, 0.0], "baseRadius": 0.05, "endRadius": 0.04, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_dish_boom_9 = makeAttachmentEndpoint(attachment_dish_boom_9);
  const node_dish_boom_9 = new THREE.Group();
  node_dish_boom_9.name = "Dish Support Boom__pivot";
  if (endpoint_dish_boom_9) {
    node_dish_boom_9.position.copy(endpoint_dish_boom_9.start);
    node_dish_boom_9.rotation.set(0, 0, 0);
    node_dish_boom_9.scale.set(1, 1, 1);
  } else {
    node_dish_boom_9.position.set(-0.34, 0.05, 0.0);
    node_dish_boom_9.rotation.set(0.0, 0.0, 0.0);
    node_dish_boom_9.scale.set(0.1, 0.5, 0.1);
  }
  node_dish_boom_9.userData.sculptComponent = {"id": "dish-boom", "name": "Dish Support Boom", "level": "meso", "role": "connector", "importance": 0.4, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Dish Support Boom decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.1, "height": 0.5, "depth": 0.1, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [-0.34, 0.05, 0], "localEnd": [-0.8400000000000001, 0.05, 0.0], "baseRadius": 0.05, "endRadius": 0.04, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [-0.34, 0.05, 0], "rotation": [0, 0, 0], "scale": [0.1, 0.5, 0.1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.05, 0.25, 0.05], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dish_boom_9.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.05, 0.25, 0.05], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_dish_boom_9);
  nodes["dish-boom"] = node_dish_boom_9;
  const mesh_dish_boom_9Geometry = endpoint_dish_boom_9
    ? new THREE.CylinderGeometry(endpoint_dish_boom_9.endRadius, endpoint_dish_boom_9.baseRadius, endpoint_dish_boom_9.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_dish_boom_9 = new THREE.Mesh(
    mesh_dish_boom_9Geometry,
    materialMap["hull-dark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_dish_boom_9.name = "Dish Support Boom";
  if (endpoint_dish_boom_9) {
    mesh_dish_boom_9.position.copy(endpoint_dish_boom_9.midpoint);
    mesh_dish_boom_9.quaternion.copy(endpoint_dish_boom_9.quaternion);
  }
  mesh_dish_boom_9.castShadow = options.castShadow ?? true;
  mesh_dish_boom_9.receiveShadow = options.receiveShadow ?? true;
  mesh_dish_boom_9.userData.sculptComponent = {"id": "dish-boom", "name": "Dish Support Boom", "level": "meso", "role": "connector", "importance": 0.4, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Dish Support Boom decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.1, "height": 0.5, "depth": 0.1, "units": "relative", "confidence": 0.6}, "material": "hull-dark", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [-0.34, 0.05, 0], "localEnd": [-0.8400000000000001, 0.05, 0.0], "baseRadius": 0.05, "endRadius": 0.04, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [-0.34, 0.05, 0], "rotation": [0, 0, 0], "scale": [0.1, 0.5, 0.1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.05, 0.25, 0.05], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dish_boom_9.add(mesh_dish_boom_9);
  meshes["dish-boom"] = mesh_dish_boom_9;
  colliders["dish-boom"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.05, 0.25, 0.05], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_dish_boom_9);

  const attachment_dish_10 = null;
  const endpoint_dish_10 = makeAttachmentEndpoint(attachment_dish_10);
  const node_dish_10 = new THREE.Group();
  node_dish_10.name = "Parabolic Dish Antenna__pivot";
  if (endpoint_dish_10) {
    node_dish_10.position.copy(endpoint_dish_10.start);
    node_dish_10.rotation.set(0, 0, 0);
    node_dish_10.scale.set(1, 1, 1);
  } else {
    node_dish_10.position.set(-0.9199999999999999, 0.05, 0.0);
    node_dish_10.rotation.set(0.0, 0.0, 1.5707963267948966);
    node_dish_10.scale.set(0.44, 0.16, 0.44);
  }
  node_dish_10.userData.sculptComponent = {"id": "dish", "name": "Parabolic Dish Antenna", "level": "meso", "role": "appendage", "importance": 0.6, "confidence": 0.6, "primitive": "cone", "topologyClass": "assembled-solid", "topologyRationale": "Parabolic Dish Antenna decomposed from the reference as a cone primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.44, "height": 0.16, "depth": 0.44, "units": "relative", "confidence": 0.6}, "material": "dish", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.9199999999999999, 0.05, 0], "rotation": [0, 0, 1.5707963267948966], "scale": [0.44, 0.16, 0.44]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cone", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dish_10.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cone", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_dish_10);
  nodes["dish"] = node_dish_10;
  const mesh_dish_10Geometry = endpoint_dish_10
    ? new THREE.CylinderGeometry(endpoint_dish_10.endRadius, endpoint_dish_10.baseRadius, endpoint_dish_10.length, 32, 12)
    : new THREE.ConeGeometry(0.5, 1, 48, 16);
  const mesh_dish_10 = new THREE.Mesh(
    mesh_dish_10Geometry,
    materialMap["dish"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_dish_10.name = "Parabolic Dish Antenna";
  if (endpoint_dish_10) {
    mesh_dish_10.position.copy(endpoint_dish_10.midpoint);
    mesh_dish_10.quaternion.copy(endpoint_dish_10.quaternion);
  }
  mesh_dish_10.castShadow = options.castShadow ?? true;
  mesh_dish_10.receiveShadow = options.receiveShadow ?? true;
  mesh_dish_10.userData.sculptComponent = {"id": "dish", "name": "Parabolic Dish Antenna", "level": "meso", "role": "appendage", "importance": 0.6, "confidence": 0.6, "primitive": "cone", "topologyClass": "assembled-solid", "topologyRationale": "Parabolic Dish Antenna decomposed from the reference as a cone primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.44, "height": 0.16, "depth": 0.44, "units": "relative", "confidence": 0.6}, "material": "dish", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.9199999999999999, 0.05, 0], "rotation": [0, 0, 1.5707963267948966], "scale": [0.44, 0.16, 0.44]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "cone", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dish_10.add(mesh_dish_10);
  meshes["dish"] = mesh_dish_10;
  colliders["dish"] = {"type": "cone", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_dish_10);

  const attachment_dock_node_11 = {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0.34, -0.03, 0], "localEnd": [0.56, -0.03, 0.0], "baseRadius": 0.15, "endRadius": 0.15, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]};
  const endpoint_dock_node_11 = makeAttachmentEndpoint(attachment_dock_node_11);
  const node_dock_node_11 = new THREE.Group();
  node_dock_node_11.name = "Docking Node__pivot";
  if (endpoint_dock_node_11) {
    node_dock_node_11.position.copy(endpoint_dock_node_11.start);
    node_dock_node_11.rotation.set(0, 0, 0);
    node_dock_node_11.scale.set(1, 1, 1);
  } else {
    node_dock_node_11.position.set(0.34, -0.03, 0.0);
    node_dock_node_11.rotation.set(0.0, 0.0, 0.0);
    node_dock_node_11.scale.set(0.3, 0.22, 0.3);
  }
  node_dock_node_11.userData.sculptComponent = {"id": "dock-node", "name": "Docking Node", "level": "meso", "role": "connector", "importance": 0.4, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Docking Node decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.3, "height": 0.22, "depth": 0.3, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0.34, -0.03, 0], "localEnd": [0.56, -0.03, 0.0], "baseRadius": 0.15, "endRadius": 0.15, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0.34, -0.03, 0], "rotation": [0, 0, 0], "scale": [0.3, 0.22, 0.3]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.15, 0.11, 0.15], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dock_node_11.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.15, 0.11, 0.15], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_dock_node_11);
  nodes["dock-node"] = node_dock_node_11;
  const mesh_dock_node_11Geometry = endpoint_dock_node_11
    ? new THREE.CylinderGeometry(endpoint_dock_node_11.endRadius, endpoint_dock_node_11.baseRadius, endpoint_dock_node_11.length, 32, 12)
    : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
  const mesh_dock_node_11 = new THREE.Mesh(
    mesh_dock_node_11Geometry,
    materialMap["hull"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_dock_node_11.name = "Docking Node";
  if (endpoint_dock_node_11) {
    mesh_dock_node_11.position.copy(endpoint_dock_node_11.midpoint);
    mesh_dock_node_11.quaternion.copy(endpoint_dock_node_11.quaternion);
  }
  mesh_dock_node_11.castShadow = options.castShadow ?? true;
  mesh_dock_node_11.receiveShadow = options.receiveShadow ?? true;
  mesh_dock_node_11.userData.sculptComponent = {"id": "dock-node", "name": "Docking Node", "level": "meso", "role": "connector", "importance": 0.4, "confidence": 0.6, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Docking Node decomposed from the reference as a cylinder primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 0.3, "height": 0.22, "depth": 0.3, "units": "relative", "confidence": 0.6}, "material": "hull", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": {"parentId": "hub", "parentSocket": "hub-far-end", "localStart": [0.34, -0.03, 0], "localEnd": [0.56, -0.03, 0.0], "baseRadius": 0.15, "endRadius": 0.15, "contactType": "welded-seam", "embedDepth": 0.03, "overlap": 0.02, "gapTolerance": 0.005, "evidenceRefs": ["full-object"]}, "transform": {"position": [0.34, -0.03, 0], "rotation": [0, 0, 0], "scale": [0.3, 0.22, 0.3]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "capsule", "offset": [0, 0, 0], "scale": [0.15, 0.11, 0.15], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_dock_node_11.add(mesh_dock_node_11);
  meshes["dock-node"] = mesh_dock_node_11;
  colliders["dock-node"] = {"type": "capsule", "offset": [0, 0, 0], "scale": [0.15, 0.11, 0.15], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_dock_node_11);

  const attachment_arm_ur_12 = null;
  const endpoint_arm_ur_12 = makeAttachmentEndpoint(attachment_arm_ur_12);
  const node_arm_ur_12 = new THREE.Group();
  node_arm_ur_12.name = "Solar Arm Upper-Right__pivot";
  if (endpoint_arm_ur_12) {
    node_arm_ur_12.position.copy(endpoint_arm_ur_12.start);
    node_arm_ur_12.rotation.set(0, 0, 0);
    node_arm_ur_12.scale.set(1, 1, 1);
  } else {
    node_arm_ur_12.position.set(0.43840620433565947, 0.43840620433565947, 0.0);
    node_arm_ur_12.rotation.set(0.0, 0.0, 0.7853981633974483);
    node_arm_ur_12.scale.set(1.15, 0.5, 0.035);
  }
  node_arm_ur_12.userData.sculptComponent = {"id": "arm-ur", "name": "Solar Arm Upper-Right", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Upper-Right decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ur-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ur-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0.43840620433565947, 0.43840620433565947, 0], "rotation": [0, 0, 0.7853981633974483], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ur_12.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_arm_ur_12);
  nodes["arm-ur"] = node_arm_ur_12;
  const mesh_arm_ur_12Geometry = endpoint_arm_ur_12
    ? new THREE.CylinderGeometry(endpoint_arm_ur_12.endRadius, endpoint_arm_ur_12.baseRadius, endpoint_arm_ur_12.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_arm_ur_12 = new THREE.Mesh(
    mesh_arm_ur_12Geometry,
    materialMap["solar-panel"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arm_ur_12.name = "Solar Arm Upper-Right";
  if (endpoint_arm_ur_12) {
    mesh_arm_ur_12.position.copy(endpoint_arm_ur_12.midpoint);
    mesh_arm_ur_12.quaternion.copy(endpoint_arm_ur_12.quaternion);
  }
  mesh_arm_ur_12.castShadow = options.castShadow ?? true;
  mesh_arm_ur_12.receiveShadow = options.receiveShadow ?? true;
  mesh_arm_ur_12.userData.sculptComponent = {"id": "arm-ur", "name": "Solar Arm Upper-Right", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Upper-Right decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ur-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ur-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0.43840620433565947, 0.43840620433565947, 0], "rotation": [0, 0, 0.7853981633974483], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ur_12.add(mesh_arm_ur_12);
  meshes["arm-ur"] = mesh_arm_ur_12;
  colliders["arm-ur"] = {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_arm_ur_12);

  const attachment_arm_ul_13 = null;
  const endpoint_arm_ul_13 = makeAttachmentEndpoint(attachment_arm_ul_13);
  const node_arm_ul_13 = new THREE.Group();
  node_arm_ul_13.name = "Solar Arm Upper-Left__pivot";
  if (endpoint_arm_ul_13) {
    node_arm_ul_13.position.copy(endpoint_arm_ul_13.start);
    node_arm_ul_13.rotation.set(0, 0, 0);
    node_arm_ul_13.scale.set(1, 1, 1);
  } else {
    node_arm_ul_13.position.set(-0.4384062043356594, 0.43840620433565947, 0.0);
    node_arm_ul_13.rotation.set(0.0, 0.0, 2.356194490192345);
    node_arm_ul_13.scale.set(1.15, 0.5, 0.035);
  }
  node_arm_ul_13.userData.sculptComponent = {"id": "arm-ul", "name": "Solar Arm Upper-Left", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Upper-Left decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ul-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ul-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.4384062043356594, 0.43840620433565947, 0], "rotation": [0, 0, 2.356194490192345], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ul_13.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_arm_ul_13);
  nodes["arm-ul"] = node_arm_ul_13;
  const mesh_arm_ul_13Geometry = endpoint_arm_ul_13
    ? new THREE.CylinderGeometry(endpoint_arm_ul_13.endRadius, endpoint_arm_ul_13.baseRadius, endpoint_arm_ul_13.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_arm_ul_13 = new THREE.Mesh(
    mesh_arm_ul_13Geometry,
    materialMap["solar-panel"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arm_ul_13.name = "Solar Arm Upper-Left";
  if (endpoint_arm_ul_13) {
    mesh_arm_ul_13.position.copy(endpoint_arm_ul_13.midpoint);
    mesh_arm_ul_13.quaternion.copy(endpoint_arm_ul_13.quaternion);
  }
  mesh_arm_ul_13.castShadow = options.castShadow ?? true;
  mesh_arm_ul_13.receiveShadow = options.receiveShadow ?? true;
  mesh_arm_ul_13.userData.sculptComponent = {"id": "arm-ul", "name": "Solar Arm Upper-Left", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Upper-Left decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ul-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ul-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.4384062043356594, 0.43840620433565947, 0], "rotation": [0, 0, 2.356194490192345], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ul_13.add(mesh_arm_ul_13);
  meshes["arm-ul"] = mesh_arm_ul_13;
  colliders["arm-ul"] = {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_arm_ul_13);

  const attachment_arm_lr_14 = null;
  const endpoint_arm_lr_14 = makeAttachmentEndpoint(attachment_arm_lr_14);
  const node_arm_lr_14 = new THREE.Group();
  node_arm_lr_14.name = "Solar Arm Lower-Right__pivot";
  if (endpoint_arm_lr_14) {
    node_arm_lr_14.position.copy(endpoint_arm_lr_14.start);
    node_arm_lr_14.rotation.set(0, 0, 0);
    node_arm_lr_14.scale.set(1, 1, 1);
  } else {
    node_arm_lr_14.position.set(0.43840620433565947, -0.43840620433565947, 0.0);
    node_arm_lr_14.rotation.set(0.0, 0.0, -0.7853981633974483);
    node_arm_lr_14.scale.set(1.15, 0.5, 0.035);
  }
  node_arm_lr_14.userData.sculptComponent = {"id": "arm-lr", "name": "Solar Arm Lower-Right", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Lower-Right decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-lr-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-lr-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0.43840620433565947, -0.43840620433565947, 0], "rotation": [0, 0, -0.7853981633974483], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_lr_14.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_arm_lr_14);
  nodes["arm-lr"] = node_arm_lr_14;
  const mesh_arm_lr_14Geometry = endpoint_arm_lr_14
    ? new THREE.CylinderGeometry(endpoint_arm_lr_14.endRadius, endpoint_arm_lr_14.baseRadius, endpoint_arm_lr_14.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_arm_lr_14 = new THREE.Mesh(
    mesh_arm_lr_14Geometry,
    materialMap["solar-panel"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arm_lr_14.name = "Solar Arm Lower-Right";
  if (endpoint_arm_lr_14) {
    mesh_arm_lr_14.position.copy(endpoint_arm_lr_14.midpoint);
    mesh_arm_lr_14.quaternion.copy(endpoint_arm_lr_14.quaternion);
  }
  mesh_arm_lr_14.castShadow = options.castShadow ?? true;
  mesh_arm_lr_14.receiveShadow = options.receiveShadow ?? true;
  mesh_arm_lr_14.userData.sculptComponent = {"id": "arm-lr", "name": "Solar Arm Lower-Right", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Lower-Right decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-lr-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-lr-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [0.43840620433565947, -0.43840620433565947, 0], "rotation": [0, 0, -0.7853981633974483], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_lr_14.add(mesh_arm_lr_14);
  meshes["arm-lr"] = mesh_arm_lr_14;
  colliders["arm-lr"] = {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_arm_lr_14);

  const attachment_arm_ll_15 = null;
  const endpoint_arm_ll_15 = makeAttachmentEndpoint(attachment_arm_ll_15);
  const node_arm_ll_15 = new THREE.Group();
  node_arm_ll_15.name = "Solar Arm Lower-Left__pivot";
  if (endpoint_arm_ll_15) {
    node_arm_ll_15.position.copy(endpoint_arm_ll_15.start);
    node_arm_ll_15.rotation.set(0, 0, 0);
    node_arm_ll_15.scale.set(1, 1, 1);
  } else {
    node_arm_ll_15.position.set(-0.4384062043356594, -0.43840620433565947, 0.0);
    node_arm_ll_15.rotation.set(0.0, 0.0, -2.356194490192345);
    node_arm_ll_15.scale.set(1.15, 0.5, 0.035);
  }
  node_arm_ll_15.userData.sculptComponent = {"id": "arm-ll", "name": "Solar Arm Lower-Left", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Lower-Left decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ll-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ll-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.4384062043356594, -0.43840620433565947, 0], "rotation": [0, 0, -2.356194490192345], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ll_15.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}};
  (nodes["hub"] ?? root).add(node_arm_ll_15);
  nodes["arm-ll"] = node_arm_ll_15;
  const mesh_arm_ll_15Geometry = endpoint_arm_ll_15
    ? new THREE.CylinderGeometry(endpoint_arm_ll_15.endRadius, endpoint_arm_ll_15.baseRadius, endpoint_arm_ll_15.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_arm_ll_15 = new THREE.Mesh(
    mesh_arm_ll_15Geometry,
    materialMap["solar-panel"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arm_ll_15.name = "Solar Arm Lower-Left";
  if (endpoint_arm_ll_15) {
    mesh_arm_ll_15.position.copy(endpoint_arm_ll_15.midpoint);
    mesh_arm_ll_15.quaternion.copy(endpoint_arm_ll_15.quaternion);
  }
  mesh_arm_ll_15.castShadow = options.castShadow ?? true;
  mesh_arm_ll_15.receiveShadow = options.receiveShadow ?? true;
  mesh_arm_ll_15.userData.sculptComponent = {"id": "arm-ll", "name": "Solar Arm Lower-Left", "level": "macro", "role": "wing", "importance": 0.85, "confidence": 0.6, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Solar Arm Lower-Left decomposed from the reference as a box primitive per surface_topology guidance.", "geometryDescriptor": {"topologyIntent": "hard-surface hull segment", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.02, "segments": 3}, "deformationStack": [], "uvStrategy": "cylindrical/planar generated UVs", "normalStrategy": "vertex normals from generated geometry"}, "dimensions": {"width": 1.15, "height": 0.5, "depth": 0.035, "units": "relative", "confidence": 0.6}, "material": "solar-panel", "materialLayers": ["hull"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arm-ll-grid", "desc": "regular solar-cell grid pattern on panel face"}, {"id": "arm-ll-truss", "desc": "thin double-rail truss along the panel's long axis"}], "surfaceDetail": {"macroRoughness": 0.4, "microRoughness": 0.15, "bumpAmplitude": 0.12, "normalPattern": "ribbed hull panel lines", "displacementPattern": "none", "occlusionPattern": "seam and panel-line darkening", "edgeWearPattern": "light edge wear on ribs", "notes": "Horizontal panel-line subdivisions per hullPanelSeams detail."}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "parent": "hub", "attachment": null, "transform": {"position": [-0.4384062043356594, -0.43840620433565947, 0], "rotation": [0, 0, -2.356194490192345], "scale": [1.15, 0.5, 0.035]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.6}, "transformChannels": {"translate": false, "rotate": true, "scale": false, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "hull", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "hull"}}};
  node_arm_ll_15.add(mesh_arm_ll_15);
  meshes["arm-ll"] = mesh_arm_ll_15;
  colliders["arm-ll"] = {"type": "box", "offset": [0, 0, 0], "scale": [0.575, 0.25, 0.02], "isTrigger": false, "notes": "Simplified proxy for runtime physics."};
  destructionGroups["hull"] ??= [];
  destructionGroups["hull"].push(node_arm_ll_15);

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createNOXOrbitalStationLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "NOX Orbital Station look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createNOXOrbitalStationEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameNOXOrbitalStationCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createNOXOrbitalStationPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}
