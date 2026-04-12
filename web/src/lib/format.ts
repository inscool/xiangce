export function formatBytes(bytes: bigint | number) {
  const value = typeof bytes === "bigint" ? Number(bytes) : bytes;
  const units = ["B", "KB", "MB", "GB", "TB"];

  if (value === 0) {
    return "0 B";
  }

  const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** unitIndex;

  return `${size >= 100 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatBytePercent(used: bigint | number, total: bigint | number) {
  const usedValue = typeof used === "bigint" ? Number(used) : used;
  const totalValue = typeof total === "bigint" ? Number(total) : total;

  if (totalValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((usedValue / totalValue) * 100));
}
