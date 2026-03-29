import type { DateRangePreset } from '@/types/dashboard';

const options: DateRangePreset[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export const DateRangeFilter = ({ value, onChange }: { value: DateRangePreset; onChange: (value: DateRangePreset) => void }) => (
  <div className="rounded-lg border bg-white dark:bg-slate-800 p-2 inline-flex gap-2">
    {options.map((option) => (
      <button
        key={option}
        className={`px-3 py-1.5 rounded text-sm ${value === option ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700'}`}
        onClick={() => onChange(option)}
      >
        {option}
      </button>
    ))}
  </div>
);
