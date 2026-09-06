"use client";


const STAGES: { status: string; percent: number; label: string }[] = [
  { status: "posted", percent: 0, label: "Posted" },
  { status: "labour_allotted", percent: 15, label: "Worker Assigned" },
  { status: "work_started", percent: 30, label: "Work Started" },
  { status: "work_in_progress", percent: 50, label: "Work in Progress" },
  { status: "work_completed", percent: 70, label: "Work Done" },
  { status: "payment_in_process", percent: 78, label: "Payment Pending" },
  { status: "verification_pending", percent: 85, label: "Verifying UTR" },
  { status: "verified", percent: 90, label: "Payment Verified" },
  { status: "payout_released", percent: 95, label: "Payout Released" },
  { status: "payment_completed", percent: 100, label: "Completed" },
];

// Map legacy statuses to canonical ones for progress display
const LEGACY_MAP: Record<string, string> = {
  payment_pending: "payment_in_process",
  payment_paid: "verified",
  payout_transferred: "payout_released",
};

interface ProgressBarProps {
  status: string;
}

export default function ProgressBar({ status }: ProgressBarProps) {
  const normalizedStatus = LEGACY_MAP[status] || status;
  const currentIndex = STAGES.findIndex((s) => s.status === normalizedStatus);
  const current = STAGES[currentIndex] || STAGES[0];

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-2.5 bg-[var(--color-bp-gray-200)] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${current.percent}%`,
            background:
              current.percent === 100
                ? "linear-gradient(90deg, #10b981, #059669)"
                : "linear-gradient(90deg, #0071e3, #34d399)",
          }}
        />
      </div>

      {/* Stage dots + labels */}
      <div className="flex justify-between mt-3">
        {STAGES.map((stage, i) => {
          const isCompleted = i <= currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div
              key={stage.status}
              className="flex flex-col items-center flex-1"
            >
              {/* Dot */}
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "bg-[var(--color-bp-blue)] border-[var(--color-bp-blue)] scale-125 shadow-sm"
                    : isCompleted
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-white border-[var(--color-bp-gray-300)]"
                }`}
              />
              {/* Label (only show for key stages to avoid clutter) */}
              {(isCurrent || i === 0 || i === STAGES.length - 1) && (
                <span
                  className={`text-[10px] mt-1.5 text-center leading-tight max-w-[60px] ${
                    isCurrent
                      ? "font-semibold text-[var(--color-bp-blue)]"
                      : "text-[var(--color-bp-gray-400)]"
                  }`}
                >
                  {stage.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage banner */}
      <div className="mt-3 text-center">
        <span className="text-sm font-medium text-[var(--color-bp-gray-600)]">
          {current.percent}% - {current.label}
        </span>
      </div>
    </div>
  );
}
