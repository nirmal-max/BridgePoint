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
  | "service"
  | "phone"
  | "location"
  | "wallet"
  | "briefcase"
  | "award"
  | "settings"
  | "info"
  | "logout"
  | "arrowRight"
  | "chevronRight"
  | "clock"
  | "fileText"
  | "filter"
  | "tools"
  | "trendingUp"
  | "user"
  | "dashboard"
  | "arrow";

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
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  location: "M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
  wallet: "M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z",
  briefcase: "M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z",
  award: "M12 15l-3.5 6 1.5-4.5L6 14h5l1-5 1 5h5l-4 2.5 1.5 4.5zM12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.7-2.3a8 8 0 0 0 0-1.4l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a8 8 0 0 0-1.2-.7l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a8 8 0 0 0-1.2.7l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6l2.1 1.6a8 8 0 0 0 0 1.4l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5a.5.5 0 0 0 .6.2l2.5-1a8 8 0 0 0 1.2.7l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a8 8 0 0 0 1.2-.7l2.5 1a.5.5 0 0 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6l-2.1-1.6z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15h.01M12 11v6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  chevronRight: "M9 18l6-6-6-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v5l3 3",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  tools: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  dashboard: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

export default function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

