type Props = {
  label: string;
  value: string;
  helper?: string;
  accent?: "default" | "pulse";
};

export function DashboardStatCard({ label, value, helper, accent = "default" }: Props) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        accent === "pulse"
          ? "border-amber-200 bg-[linear-gradient(135deg,#fff9eb_0%,#fff4d8_100%)]"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent === "pulse" ? "text-amber-700" : "text-zinc-900"}`}>
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-zinc-600">{helper}</p> : null}
    </div>
  );
}
