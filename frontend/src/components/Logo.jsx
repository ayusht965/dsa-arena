export default function Logo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="arenaGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      <rect
        x="10"
        y="10"
        width="100"
        height="100"
        rx="24"
        fill="url(#arenaGradient)"
      />

      <rect
        x="22"
        y="22"
        width="76"
        height="76"
        rx="18"
        fill="#020617"
      />

      <path
        d="M52 42 L40 60 L52 78"
        stroke="#6366F1"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M68 42 L80 60 L68 78"
        stroke="#22D3EE"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
