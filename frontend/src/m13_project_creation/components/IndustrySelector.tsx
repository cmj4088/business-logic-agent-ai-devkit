import { ComplianceHints } from './ComplianceHints';

interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const INDUSTRY_OPTIONS = [
  { value: '消费电子', label: '消费电子' },
  { value: '医疗器械', label: '医疗器械' },
  { value: '汽车电子', label: '汽车电子' },
  { value: '航空', label: '航空' },
  { value: '软件', label: '软件' },
  { value: '其他', label: '其他' },
] as const;

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-1">
        行业选择
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
      >
        {INDUSTRY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ComplianceHints industry={value} />
    </div>
  );
}