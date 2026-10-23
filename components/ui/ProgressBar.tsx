interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  color?: 'blue' | 'emerald' | 'violet' | 'amber';
  showValue?: boolean;
  size?: 'sm' | 'md';
}

const colors = {
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-600',
  amber: 'bg-amber-500',
};

export default function ProgressBar({
  value,
  label,
  color = 'blue',
  showValue = true,
  size = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-slate-800">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-100 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`${colors[color]} h-full rounded-full transition-all duration-700`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
