/** "Powered by: Propelity", linking to propelity.io in a new tab. */
export function PoweredBy({ className = "" }: { className?: string }) {
  return (
    <p className={`whitespace-nowrap ${className}`}>
      Powered by:{" "}
      <a
        href="https://propelity.io"
        target="_blank"
        rel="noopener noreferrer"
        className="font-serif text-[1.05em] text-[var(--maroon)] underline-offset-2 hover:underline"
      >
        Propelity
      </a>
    </p>
  );
}
