/**
 * Framer runtime shim.
 *
 * The originkit effects are ports of Framer code components. In Framer they
 * import `RenderTarget`, `useIsStaticRenderer` and `ControlType` from the
 * `framer` package to freeze themselves on the static canvas / export /
 * thumbnail renderer. The arsenal has no Framer runtime, so those imports were
 * stripped during the port — but the call sites stayed, which turned every
 * affected effect into a `ReferenceError` at render time.
 *
 * Here we are always the live DOM renderer, so the static-render checks must
 * all resolve to "not static" and the effects animate normally.
 */

export const RenderTarget = {
  canvas: 'canvas',
  export: 'export',
  thumbnail: 'thumbnail',
  preview: 'preview',
  /** The arsenal only ever renders live previews. */
  current(): string {
    return 'preview';
  },
} as const;

/** Framer returns true on canvas/export/thumbnail. We are always live. */
export function useIsStaticRenderer(): boolean {
  return false;
}

/**
 * Property-control metadata enum. The arsenal drives props through its own
 * catalog `props` definitions, so these values are never interpreted — they
 * only need to exist so the ported `addPropertyControls` blocks still parse.
 */
export const ControlType = {
  Array: 'array',
  Boolean: 'boolean',
  Color: 'color',
  ComponentInstance: 'componentinstance',
  Date: 'date',
  Enum: 'enum',
  File: 'file',
  Font: 'font',
  Image: 'image',
  Link: 'link',
  Number: 'number',
  Object: 'object',
  Padding: 'padding',
  ResponsiveImage: 'responsiveimage',
  RichText: 'richtext',
  BorderRadius: 'borderradius',
  Border: 'border',
  BoxShadow: 'boxshadow',
  String: 'string',
  Transition: 'transition',
} as const;

/** No-op: Framer's control registration has no meaning outside Framer. */
export function addPropertyControls(..._args: unknown[]): void {}

/** Framer-only authoring warning; live arsenal previews fail soft instead. */
export function ComponentMessage(_props: Record<string, unknown> = {}): null {
  return null;
}
