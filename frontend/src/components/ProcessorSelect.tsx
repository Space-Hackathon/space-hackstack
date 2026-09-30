import type { ProcessorDescriptor } from "../types";

export interface ProcessorSelectProps {
  processors: ProcessorDescriptor[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function ProcessorSelect({
  processors,
  value,
  onChange,
  disabled = false,
  id = "processor",
}: ProcessorSelectProps) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      Processor
      <select
        id={id}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={disabled}
      >
        <option value="">Choose automatically</option>
        {processors.map((processor) => (
          <option key={processor.name} value={processor.name}>
            {processor.name} — {processor.description}
          </option>
        ))}
      </select>
    </label>
  );
}
