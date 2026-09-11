import { BreachItem, PasteItem, PasswordTag, ChecklistItem, ActionItem } from '../types';

/**
 * Calculate a Security Score from 0 (worst) to 100 (best).
 *
 * Factors:
 * - Breach count & severity (max -40 pts)
 * - Unresolved actions (max -20 pts)
 * - Password reuse groups (max -15 pts)
 * - Paste exposure (max -10 pts)
 * - Checklist completion (up to +15 pts bonus)
 *
 * Starts at 100, deductions bring it down.
 */
export function calculateSecurityScore(
  breaches: BreachItem[],
  actionItems: ActionItem[],
  pastes: PasteItem[],
  tags: PasswordTag[],
  checklist: ChecklistItem[]
): { score: number; grade: string; color: string; factors: ScoreFactor[] } {
  let score = 100;
  const factors: ScoreFactor[] = [];

  // --- Breach severity deductions (max -40) ---
  const criticalBreaches = breaches.filter(b => b.severity === 'critical').length;
  const highBreaches = breaches.filter(b => b.severity === 'high').length;
  const medBreaches = breaches.filter(b => b.severity === 'medium').length;
  const lowBreaches = breaches.filter(b => b.severity === 'low').length;

  const breachPenalty = Math.min(40,
    criticalBreaches * 8 + highBreaches * 5 + medBreaches * 2 + lowBreaches * 1
  );
  score -= breachPenalty;
  if (breachPenalty > 0) {
    factors.push({
      label: `${breaches.length} breach${breaches.length === 1 ? '' : 'es'} found`,
      impact: -breachPenalty,
      type: 'negative'
    });
  }

  // --- Unresolved action deductions (max -20) ---
  const unresolvedCount = actionItems.length;
  const unresolvedPenalty = Math.min(20, unresolvedCount * 3);
  score -= unresolvedPenalty;
  if (unresolvedPenalty > 0) {
    factors.push({
      label: `${unresolvedCount} unresolved action${unresolvedCount === 1 ? '' : 's'}`,
      impact: -unresolvedPenalty,
      type: 'negative'
    });
  }

  // --- Password reuse deductions (max -15) ---
  const uniqueTags = new Set(tags.map(t => t.tagLabel));
  const reuseGroups = uniqueTags.size;
  const reusePenalty = Math.min(15, reuseGroups * 5);
  score -= reusePenalty;
  if (reusePenalty > 0) {
    factors.push({
      label: `${reuseGroups} password reuse group${reuseGroups === 1 ? '' : 's'}`,
      impact: -reusePenalty,
      type: 'negative'
    });
  }

  // --- Paste exposure deductions (max -10) ---
  const pastePenalty = Math.min(10, pastes.length * 2);
  score -= pastePenalty;
  if (pastePenalty > 0) {
    factors.push({
      label: `${pastes.length} dark web paste${pastes.length === 1 ? '' : 's'}`,
      impact: -pastePenalty,
      type: 'negative'
    });
  }

  // --- Resolved items bonus (max +10) ---
  const resolvedBreaches = breaches.filter(b => b.resolved).length;
  if (resolvedBreaches > 0 && breaches.length > 0) {
    const resolveRatio = resolvedBreaches / breaches.length;
    const resolveBonus = Math.round(resolveRatio * 10);
    score += resolveBonus;
    factors.push({
      label: `${resolvedBreaches} breach${resolvedBreaches === 1 ? '' : 'es'} resolved`,
      impact: resolveBonus,
      type: 'positive'
    });
  }

  // --- Checklist bonus (max +5) ---
  if (checklist.length > 0) {
    const completed = checklist.filter(c => c.completed).length;
    const checklistRatio = completed / checklist.length;
    const checklistBonus = Math.round(checklistRatio * 5);
    score += checklistBonus;
    if (checklistBonus > 0) {
      factors.push({
        label: `${completed}/${checklist.length} security steps done`,
        impact: checklistBonus,
        type: 'positive'
      });
    }
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // No breaches at all = perfect score
  if (breaches.length === 0 && pastes.length === 0) {
    score = 100;
  }

  const { grade, color } = getGrade(score);

  return { score, grade, color, factors };
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'Excellent', color: '#2E6E63' };
  if (score >= 75) return { grade: 'Good', color: '#3D8B7A' };
  if (score >= 60) return { grade: 'Fair', color: '#6B6338' };
  if (score >= 40) return { grade: 'Poor', color: '#93531A' };
  return { grade: 'Critical', color: '#B3271D' };
}

export interface ScoreFactor {
  label: string;
  impact: number;
  type: 'positive' | 'negative';
}
