import React, { useState } from 'react';
import type { EffectPropControl } from '../types';

interface Props {
  controls: EffectPropControl[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

function ControlRow({ c, v, onChange }: { c: EffectPropControl; v: unknown; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="prop-row" key={c.key}>
      <label>
        <span>{c.label}</span>
        <span>{c.type === 'range' ? Number(v).toFixed(c.step && c.step < 1 ? 2 : 0) : String(v)}</span>
      </label>
      {c.type === 'range' && (
        <input
          data-control-key={c.key}
          type="range"
          min={c.min}
          max={c.max}
          step={c.step ?? 1}
          value={Number(v)}
          onChange={(e) => onChange(c.key, Number(e.target.value))}
        />
      )}
      {c.type === 'select' && (
        <select data-control-key={c.key} value={String(v)} onChange={(e) => onChange(c.key, e.target.value)}>
          {c.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      {c.type === 'color' && (
        <input data-control-key={c.key} type="color" value={String(v)} onChange={(e) => onChange(c.key, e.target.value)} />
      )}
      {c.type === 'boolean' && (
        <input data-control-key={c.key} type="checkbox" checked={Boolean(v)} onChange={(e) => onChange(c.key, e.target.checked)} />
      )}
      {c.type === 'text' && (
        <input data-control-key={c.key} type="text" value={String(v)} onChange={(e) => onChange(c.key, e.target.value)} />
      )}
    </div>
  );
}

function GroupSection({
  title,
  controls,
  values,
  onChange,
}: {
  title: string;
  controls: EffectPropControl[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="prop-group">
      <button type="button" className="prop-group-header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className={`prop-group-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="prop-group-body">
          {controls.map((c) => (
            <ControlRow key={c.key} c={c} v={values[c.key] ?? c.default} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PropsPanel({ controls, values, onChange }: Props) {
  if (!controls.length) return null;

  const ungrouped = controls.filter((c) => !c.group);
  const groups: { title: string; controls: EffectPropControl[] }[] = [];
  for (const c of controls) {
    if (!c.group) continue;
    let g = groups.find((g) => g.title === c.group);
    if (!g) {
      g = { title: c.group, controls: [] };
      groups.push(g);
    }
    g.controls.push(c);
  }

  return (
    <div className="panel">
      <h4>Controls</h4>
      {ungrouped.map((c) => (
        <ControlRow key={c.key} c={c} v={values[c.key] ?? c.default} onChange={onChange} />
      ))}
      {groups.map((g) => (
        <GroupSection key={g.title} title={g.title} controls={g.controls} values={values} onChange={onChange} />
      ))}
    </div>
  );
}
