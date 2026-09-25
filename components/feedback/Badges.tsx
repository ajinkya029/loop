import clsx from "clsx";

export function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  const map: Record<string, string> = {
    POSITIVE: "bg-green-100 text-green-700",
    NEUTRAL: "bg-gray-100 text-gray-600",
    NEGATIVE: "bg-red-100 text-red-700",
  };
  return (
    <span className={clsx("badge", sentiment ? map[sentiment] : "bg-gray-100 text-gray-400")}>
      {sentiment ? sentiment.charAt(0) + sentiment.slice(1).toLowerCase() : "Unclassified"}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    REVIEWED: "bg-amber-100 text-amber-700",
    ACTIONED: "bg-emerald-100 text-emerald-700",
  };
  return <span className={clsx("badge", map[status])}>{status}</span>;
}

const CHANNEL_LABELS: Record<string, string> = {
  SUPPORT_TICKET: "Support Ticket",
  APP_STORE_REVIEW: "App Store Review",
  NPS_SURVEY: "NPS Survey",
  CSAT_SURVEY: "CSAT Survey",
  SALES_CALL_NOTE: "Sales Call Note",
  SOCIAL_MENTION: "Social Mention",
  CSV_IMPORT: "CSV Import",
  MANUAL: "Manual Entry",
};

export function ChannelBadge({ channel }: { channel: string }) {
  return <span className="badge bg-brand-50 text-brand-700">{CHANNEL_LABELS[channel] ?? channel}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    ANALYST: "bg-blue-100 text-blue-700",
    VIEWER: "bg-gray-100 text-gray-600",
  };
  return <span className={clsx("badge", map[role])}>{role}</span>;
}

export { CHANNEL_LABELS };
