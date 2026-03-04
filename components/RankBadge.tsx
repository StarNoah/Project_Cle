interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  if (rank > 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--muted)] text-xs font-bold text-[var(--muted-foreground)]">
        {rank}
      </span>
    );
  }

  const styles = {
    1: { bg: "bg-amber-400", text: "text-amber-900", label: "🥇" },
    2: { bg: "bg-gray-300", text: "text-gray-700", label: "🥈" },
    3: { bg: "bg-amber-700", text: "text-amber-100", label: "🥉" },
  } as const;

  const style = styles[rank as 1 | 2 | 3];

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${style.bg} ${style.text} text-sm font-bold shadow-md`}
    >
      {style.label}
    </span>
  );
}
