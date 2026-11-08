const sizeCollator = new Intl.Collator("sk", {
  numeric: true,
  sensitivity: "base",
});

function letterSizeRank(size: string): number | null {
  const normalized = size.trim().toUpperCase();

  if (normalized === "M") {
    return 0;
  }

  const match = /^(X+|[2-9]\d*X)?([SL])$/.exec(normalized);
  if (!match) {
    return null;
  }

  const prefix = match[1] ?? "";
  const extraCount = prefix.startsWith("X")
    ? prefix.length
    : prefix
      ? Number.parseInt(prefix, 10)
      : 0;

  return (match[2] === "S" ? -1 : 1) * (extraCount + 1);
}

function classifySize(size: string): { group: number; value: number } {
  const letterRank = letterSizeRank(size);
  if (letterRank !== null) {
    return { group: 0, value: letterRank };
  }

  const normalized = size.trim().replace(",", ".");
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return { group: 1, value: Number(normalized) };
  }

  return { group: 2, value: 0 };
}

export function compareSizes(first: string | null, second: string | null): number {
  if (first === null || second === null) {
    return first === second ? 0 : first === null ? 1 : -1;
  }

  const firstSize = classifySize(first);
  const secondSize = classifySize(second);

  return (
    firstSize.group - secondSize.group ||
    firstSize.value - secondSize.value ||
    sizeCollator.compare(first, second)
  );
}
