import { formatBytePercent, formatBytes } from "@/lib/format";

type Props = {
  usedStorage: bigint;
  storageLimit: bigint;
};

export function SidebarStorageMini({ usedStorage, storageLimit }: Props) {
  const percent = formatBytePercent(usedStorage, storageLimit);

  return (
    <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">存储占用</span>
        <span className="text-xs text-zinc-300">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {formatBytes(usedStorage)} / {formatBytes(storageLimit)}
      </p>
    </div>
  );
}
