/** "Powered by: Propelity", linking to propelity.io in a new tab. */
export function PoweredBy({ className = "", label = "Powered by:" }: { className?: string; label?: string }) {
  return (
    <p className={`whitespace-nowrap ${className}`}>
      {label}{" "}
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
