import type { DateRangePreset } from '@/types/dashboard';

const options: DateRangePreset[] = ['today', '7d', '30d', '90d'];

export const DateRangeFilter = ({ value, onChange }: { value: DateRangePreset; onChange: (value: DateRangePreset) => void }) => (
  <div className="rounded-lg border bg-white dark:bg-slate-800 p-2 inline-flex gap-2">
    {options.map((option) => (
      <button
        key={option}
        className={`px-3 py-1.5 rounded text-sm ${value === option ? 'bg-[#FFB6C1] text-[#1F2937] dark:bg-white dark:text-slate-900' : 'bg-[#FFE4E8] dark:bg-slate-700'}`}
        onClick={() => onChange(option)}
      >
        {option}
      </button>
    ))}
  </div>
);
