import React from 'react';
export function ProcessorSelect({ processors, value, onChange, disabled, id = 'processor' }) {
  return <label htmlFor={id}>Processor<select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}><option value="">Choose automatically</option>{processors.map((p) => <option key={p.name} value={p.name}>{p.name} — {p.description}</option>)}</select></label>;
}
