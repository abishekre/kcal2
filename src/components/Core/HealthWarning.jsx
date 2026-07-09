import { AlertTriangle } from 'lucide-react';
import { HEALTH_STATUS_INFO } from '../../engine/projection';

/**
 * Surfaces the safety guidance that calculateGoalCalories already computes
 * (dangerous/aggressive targets + protein-too-high) wherever a plan is shown.
 * Renders nothing when the plan is healthy, so it only appears when it matters.
 *
 * @param {string} status - projection.status
 * @param {string|null} proteinWarning - projection.proteinWarning
 */
export default function HealthWarning({ status, proteinWarning }) {
  const info = HEALTH_STATUS_INFO[status] || null;
  if (!info && !proteinWarning) return null;

  const danger = info?.severity === 'danger';
  const tone = danger
    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300';
  const iconColor = danger ? 'text-rose-500' : 'text-amber-500';

  return (
    <div role="alert" className={`p-4 rounded-[20px] border flex items-start gap-3 ${tone}`}>
      <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
      <div className="text-[13px] font-medium leading-relaxed space-y-1.5">
        {info && (
          <p><strong className="font-bold">{info.title}.</strong> {info.message}</p>
        )}
        {proteinWarning && <p>{proteinWarning}</p>}
      </div>
    </div>
  );
}
