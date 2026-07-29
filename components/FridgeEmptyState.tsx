export function FridgeEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <svg
        width="112"
        height="132"
        viewBox="0 0 112 132"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="16"
          y="8"
          width="80"
          height="116"
          rx="14"
          className="stroke-muted-foreground/50"
          strokeWidth="3"
        />
        <line
          x1="16"
          y1="48"
          x2="96"
          y2="48"
          className="stroke-muted-foreground/50"
          strokeWidth="3"
        />
        <line
          x1="28"
          y1="18"
          x2="28"
          y2="36"
          className="stroke-muted-foreground/50"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="58"
          x2="28"
          y2="88"
          className="stroke-muted-foreground/50"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <text
          x="60"
          y="96"
          textAnchor="middle"
          fontSize="34"
          className="fill-primary font-heading font-bold"
        >
          ?
        </text>
      </svg>
      <p className="text-sm text-muted-foreground">
        Aggiungi qualche ingrediente per iniziare
      </p>
    </div>
  );
}
