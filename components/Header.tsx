export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="font-heading text-xl font-bold text-primary">
        Blendit
      </span>
      <span
        aria-label="Aiuto"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground"
      >
        ?
      </span>
    </header>
  );
}
