type ProgressBarProps = {
  value: number;
  total: number;
  label?: string;
};

export default function ProgressBar({ value, total, label }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.min((value / total) * 100, 100);

  return (
    <div>
      {label ? <p className="mb-2 text-sm font-medium text-slate-700">{label}</p> : null}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-sm text-slate-600">
        {value} / {total} conditions completed
      </div>
    </div>
  );
}
