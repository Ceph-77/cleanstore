import { useMemo } from "react";
import { useUnseenMoments, useMarkMomentSeen } from "../../hooks/useEngagement";

const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes cs-confetti-fall {
          0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(112vh) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: 9,
            height: 14,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `cs-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function CelebrationModal() {
  const { data: moments } = useUnseenMoments();
  const markSeen = useMarkMomentSeen();

  const current = moments?.[0];
  if (!current) return null;

  const remaining = (moments?.length ?? 0) - 1;

  return (
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-canvas-900/70 p-4">
      <Confetti />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <p className="font-heading text-2xl font-semibold leading-snug text-canvas-900">{current.title}</p>

        {current.pointsAwarded > 0 && (
          <span className="mt-4 inline-flex items-center rounded-full bg-linen-100 px-4 py-1.5 text-lg font-bold text-linen-900">
            +{current.pointsAwarded} pts
          </span>
        )}

        <p className="mt-4 text-sm text-canvas-600">{current.body}</p>

        <button
          type="button"
          disabled={markSeen.isPending}
          onClick={() => markSeen.mutate(current.id)}
          className="mt-6 w-full rounded-xl bg-flow-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-flow-700 disabled:opacity-50"
        >
          {remaining > 0 ? `Continuer (${remaining} de plus)` : "Continuer"}
        </button>
      </div>
    </div>
  );
}
