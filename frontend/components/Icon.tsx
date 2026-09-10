export type IconName =
  | "alert"
  | "bell"
  | "calendar"
  | "card"
  | "chat"
  | "check"
  | "close"
  | "lock"
  | "search"
  | "shield"
  | "star"
  | "users"
  | "service";

const paths: Record<IconName, string> = {
  alert: "M12 3 2.8 20h18.4L12 3Zm0 5.4v5.2m0 3.2h.01",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Zm-8.5 11h5",
  calendar: "M7 2v4m10-4v4M4 9h16M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Z",
  card: "M3 6h18v12H3V6Zm0 4h18M7 15h3",
  chat: "M4 5h16v11H8l-4 4V5Z",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M18 6 6 18",
  lock: "M6 10h12v10H6V10Zm3 0V7a3 3 0 0 1 6 0v3",
  search: "m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
  shield: "M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  users: "M16 20v-1.5a4.5 4.5 0 0 0-9 0V20m4.5-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5.5-5a2.5 2.5 0 0 1 0 5m1 7v-1.5a4 4 0 0 0-2-3.5",
  service: "M4 18h16M6 18V9l6-4 6 4v9M9 18v-5h6v5",
};

export default function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
