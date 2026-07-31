import type { EffectEntry, EffectMeta, EffectPropControl } from '../types';
import { BUILD_INFO } from './buildInfo';

/**
 * Kanonischer Konfigurations-State eines Effekts.
 *
 * Preview, Controls, Usage-JSX, COPY CONFIG, COPY BRIEF und der Share-Link
 * lesen ausschließlich aus `EffectConfigState.values`. Vorher hing der
 * Usage-Code am statischen `meta.usageJsx`-String im Katalog, wodurch der
 * kopierte Code andere Zahlen zeigte als der Regler daneben.
 */
export type ConfigValue = number | string | boolean;
export type EffectConfigValues = Record<string, ConfigValue>;

export interface EffectConfigState {
  effectId: string;
  values: EffectConfigValues;
}

export interface EffectConfigDocument {
  effectId: string;
  component: string;
  importPath: string;
  preset: string | null;
  materialVariant: string | null;
  energy: string | null;
  /**
   * Alle aktiven Parameter unter sprechenden Namen (aus den Control-Labels).
   * Das ist die menschenlesbare Sicht für den Handoff.
   */
  controls: EffectConfigValues;
  /**
   * Dieselben Werte unter den echten Komponenten-Prop-Namen. Daraus wird das
   * JSX gebaut, damit Brief und Code nicht auseinanderlaufen können.
   */
  props: EffectConfigValues;
  responsive: {
    mobileNotes: string;
    fullBleed: boolean;
    clickToRun: boolean;
  };
  reducedMotion: {
    respectsPreference: true;
    notes: string;
  };
  build: {
    effectVersion: string;
    commit: string;
    buildTime: string;
    lastUpdatedAt: string;
    improvementStatus: string;
    lastImprovedAt: string | null;
  };
}

/** Anzahl Nachkommastellen, die ein Range-Control tatsächlich auflöst. */
export function stepDecimals(control: EffectPropControl): number {
  if (control.type !== 'range') return 0;
  const step = control.step ?? 1;
  if (!Number.isFinite(step) || step <= 0) return 0;
  const text = String(step);
  const scientific = text.match(/e-(\d+)$/i);
  if (scientific) return Number(scientific[1]);
  const decimals = text.split('.')[1];
  return decimals ? decimals.length : 0;
}

/**
 * Rundet auf die Auflösung des Controls. Ohne das erzeugt der Range-Input
 * Float-Rauschen (0.065 + 0.005 = 0.07000000000000001) und Label, JSON und
 * JSX zeigen drei verschiedene Zahlen für denselben Zustand.
 */
export function normalizeControlValue(control: EffectPropControl, raw: unknown): ConfigValue {
  switch (control.type) {
    case 'range': {
      const value = Number(raw);
      if (!Number.isFinite(value)) return Number(control.default);
      const clamped = Math.min(
        control.max ?? Number.POSITIVE_INFINITY,
        Math.max(control.min ?? Number.NEGATIVE_INFINITY, value),
      );
      return Number(clamped.toFixed(stepDecimals(control)));
    }
    case 'boolean':
      return typeof raw === 'string' ? raw === 'true' : Boolean(raw);
    case 'select': {
      const value = String(raw);
      return control.options?.includes(value) ? value : String(control.default);
    }
    default:
      return String(raw ?? control.default);
  }
}

export function defaultConfigValues(meta: EffectMeta): EffectConfigValues {
  return Object.fromEntries(
    meta.props.map((control) => [control.key, normalizeControlValue(control, control.default)]),
  );
}

/** Fremde/veraltete Keys werden verworfen, fehlende auf den Default gesetzt. */
export function normalizeConfigValues(meta: EffectMeta, raw: unknown): EffectConfigValues {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    meta.props.map((control) => [
      control.key,
      normalizeControlValue(control, control.key in source ? source[control.key] : control.default),
    ]),
  );
}

/** 'Fresnel Power' → 'fresnelPower', 'Variant Switcher' → 'variantSwitcher'. */
export function controlSlug(control: EffectPropControl): string {
  const words = control.label
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (!words.length) return control.key;
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

function findControl(meta: EffectMeta, predicate: (c: EffectPropControl) => boolean) {
  return meta.props.find(predicate);
}

function selectValue(
  meta: EffectMeta,
  values: EffectConfigValues,
  predicate: (c: EffectPropControl) => boolean,
): string | null {
  const control = findControl(meta, (c) => c.type === 'select' && predicate(c));
  if (!control) return null;
  return String(values[control.key] ?? control.default);
}

/**
 * Preset und Material-Variante kommen aus demselben Live-Control. In der
 * Referenz-Config wichen beide voneinander ab — genau das war der Desync.
 */
export function buildEffectConfigDocument(
  entry: EffectEntry,
  values: EffectConfigValues,
): EffectConfigDocument {
  const m = entry.meta;
  const normalized = normalizeConfigValues(m, values);

  const presetValue = selectValue(m, normalized, (c) => c.key === 'preset' || c.key === 'variant');
  const materialValue =
    selectValue(m, normalized, (c) => c.key === 'materialVariant' || /material/i.test(c.label)) ??
    presetValue;
  const energyValue = selectValue(m, normalized, (c) => c.key === 'energy' || /energy/i.test(c.label));

  const controls: EffectConfigValues = {};
  for (const control of m.props) {
    controls[controlSlug(control)] = normalized[control.key];
  }

  return {
    effectId: m.id,
    component: m.name,
    importPath: m.importPath,
    preset: presetValue,
    materialVariant: materialValue,
    energy: energyValue,
    controls,
    props: normalized,
    responsive: {
      mobileNotes: m.mobileNotes,
      fullBleed: Boolean(m.fullBleed),
      clickToRun: Boolean(m.clickToRun) || m.complexity === 'heavy',
    },
    reducedMotion: {
      respectsPreference: true,
      notes: m.reducedMotionNotes,
    },
    build: {
      effectVersion: m.improvementVersion ?? '1.0.0',
      commit: BUILD_INFO.commit,
      buildTime: BUILD_INFO.buildTime,
      lastUpdatedAt: m.updatedAt ?? BUILD_INFO.buildTime,
      improvementStatus: m.improvementStatus ?? 'pending',
      lastImprovedAt: m.lastImprovedAt ?? null,
    },
  };
}

export function buildConfigJson(entry: EffectEntry, values: EffectConfigValues): string {
  return `${JSON.stringify(buildEffectConfigDocument(entry, values), null, 2)}\n`;
}

export function componentIdentifier(meta: EffectMeta): string {
  return meta.name.replace(/[^A-Za-z0-9]/g, '');
}

export function buildImportLine(meta: EffectMeta): string {
  return `import { ${componentIdentifier(meta)} } from '${meta.importPath}';`;
}

function jsxAttribute(control: EffectPropControl, value: ConfigValue): string {
  if (control.type === 'boolean') return value ? control.key : `${control.key}={false}`;
  if (control.type === 'range') return `${control.key}={${value}}`;
  return `${control.key}="${String(value).replace(/"/g, '&quot;')}"`;
}

/**
 * Vollständiges JSX aus dem Live-State — inklusive aller Props, damit der
 * kopierte Code exakt das rendert, was in der Preview steht.
 */
export function buildUsageJsx(entry: EffectEntry, values: EffectConfigValues): string {
  const m = entry.meta;
  const normalized = normalizeConfigValues(m, values);
  const name = componentIdentifier(m);
  if (!m.props.length) return `<${name} />`;
  const attributes = m.props.map((control) => jsxAttribute(control, normalized[control.key]));
  return `<${name}\n${attributes.map((a) => `  ${a}`).join('\n')}\n/>`;
}

export function buildImplementationBrief(entry: EffectEntry, values: EffectConfigValues): string {
  const doc = buildEffectConfigDocument(entry, values);
  const m = entry.meta;
  const lines: string[] = [];

  lines.push(`# Implementation Brief — ${m.displayName ?? m.name}`);
  lines.push('');
  lines.push(`Effect ID:      ${doc.effectId}`);
  lines.push(`Component:      ${doc.component}`);
  lines.push(`Import:         ${doc.importPath}`);
  lines.push(`Effect version: ${doc.build.effectVersion}`);
  lines.push(`Build commit:   ${doc.build.commit}`);
  lines.push(`Build time:     ${doc.build.buildTime}`);
  lines.push(`Last update:    ${doc.build.lastUpdatedAt}`);
  lines.push(`Status:         ${doc.build.improvementStatus}${doc.build.lastImprovedAt ? ` (${doc.build.lastImprovedAt})` : ''}`);
  lines.push('');
  lines.push('## Konfiguration');
  if (doc.preset) lines.push(`- preset: ${doc.preset}`);
  if (doc.materialVariant) lines.push(`- materialVariant: ${doc.materialVariant}`);
  if (doc.energy) lines.push(`- energy: ${doc.energy}`);
  for (const control of m.props) {
    lines.push(`- ${controlSlug(control)} (prop \`${control.key}\`): ${String(doc.props[control.key])}`);
  }
  lines.push('');
  lines.push('## Integration');
  lines.push('```tsx');
  lines.push(buildImportLine(m));
  lines.push('');
  lines.push(buildUsageJsx(entry, values));
  lines.push('```');
  lines.push('');
  lines.push('## Rahmenbedingungen');
  lines.push(`- Abhängigkeiten: ${m.dependencies.length ? m.dependencies.join(', ') : 'keine'}`);
  lines.push(`- Performance: ${m.performanceNotes}`);
  lines.push(`- Mobile / responsive: ${doc.responsive.mobileNotes}`);
  lines.push(`- Full-bleed Layout: ${doc.responsive.fullBleed ? 'ja' : 'nein'}`);
  lines.push(`- Click-to-run (heavy): ${doc.responsive.clickToRun ? 'ja' : 'nein'}`);
  lines.push(`- Reduced Motion: ${doc.reducedMotion.notes}`);
  lines.push('');
  lines.push('## Canonical Config');
  lines.push('```json');
  lines.push(JSON.stringify(doc, null, 2));
  lines.push('```');
  return `${lines.join('\n')}\n`;
}

// --- Share Link -------------------------------------------------------------

export const SHARE_PARAM = 'config';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeConfigParam(values: EffectConfigValues): string {
  return toBase64Url(JSON.stringify(values));
}

export function decodeConfigParam(meta: EffectMeta, encoded: string | null): EffectConfigValues | null {
  if (!encoded) return null;
  try {
    return normalizeConfigValues(meta, JSON.parse(fromBase64Url(encoded)));
  } catch {
    // Ein kaputter Link darf den Effekt nicht blockieren — Defaults gewinnen.
    return null;
  }
}

export function buildShareLink(entry: EffectEntry, values: EffectConfigValues, origin?: string): string {
  const base = origin ?? (typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`);
  const normalized = normalizeConfigValues(entry.meta, values);
  return `${base}#/effect/${entry.meta.id}?${SHARE_PARAM}=${encodeConfigParam(normalized)}`;
}

// --- Presets (localStorage) -------------------------------------------------

export const PRESET_STORAGE_KEY = 'nox-motion-arsenal:presets:v1';

export type PresetStore = Record<string, EffectConfigValues>;

export function readPresetStore(): PresetStore {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PRESET_STORAGE_KEY) ?? '{}');
    return raw && typeof raw === 'object' ? (raw as PresetStore) : {};
  } catch {
    return {};
  }
}

export function writePresetStore(store: PresetStore): void {
  try {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Presets bleiben für die laufende Session nutzbar, wenn Storage blockt.
  }
}
