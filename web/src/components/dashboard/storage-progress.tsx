import { formatBytePercent, formatBytes } from "@/lib/format";

type Props = {
  usedStorage: bigint;
  storageLimit: bigint;
};

export function StorageProgress({ usedStorage, storageLimit }: Props) {
  const percent = formatBytePercent(usedStorage, storageLimit);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Storage Usage</h2>
        <span className="text-sm text-zinc-600">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-zinc-900" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Used {formatBytes(usedStorage)} / Total {formatBytes(storageLimit)}
      </p>
    </section>
  );
}
