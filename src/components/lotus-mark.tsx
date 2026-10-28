/** Fine-line lotus used as the Monk Companion mark. Decorative. */
export function LotusMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 5.5c3.6 4.4 3.6 13.6 0 18.5-3.6-4.9-3.6-14.1 0-18.5Z" />
      <path d="M16 24c-5.8-.6-9.7-4.9-10.6-10.4 5.2.2 9.1 4.2 10.6 10.4Z" />
      <path d="M16 24c5.8-.6 9.7-4.9 10.6-10.4-5.2.2-9.1 4.2-10.6 10.4Z" />
      <path d="M7.5 27.5h17" />
    </svg>
  );
}
