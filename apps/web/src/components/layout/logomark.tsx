export function Logomark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect width="32" height="32" rx="8" className="fill-ink-900 dark:fill-ink-800" />
      <path
        d="M9 13.5C9 12.1193 10.1193 11 11.5 11H14.6716C15.3346 11 15.9706 11.2634 16.4393 11.7322L17.7678 13.0607C18.2366 13.5294 18.8726 13.7929 19.5355 13.7929H20.5C21.8807 13.7929 23 14.9122 23 16.2929V19.5C23 20.8807 21.8807 22 20.5 22H11.5C10.1193 22 9 20.8807 9 19.5V13.5Z"
        className="stroke-gold-400"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
