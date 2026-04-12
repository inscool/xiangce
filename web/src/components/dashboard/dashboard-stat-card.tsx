type Props = {
  label: string;
  value: string;
  helper?: string;
};

export function DashboardStatCard({ label, value, helper }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-zinc-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-zinc-600">{helper}</p> : null}
    </div>
  );
}
