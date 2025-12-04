/**
 * Product utility functions
 * Extracted from Products.tsx for better organization and testability
 */

import type { Step4Results } from '@/types/products';

/**
 * Generate a unique key for an update (for comparison)
 */
export const getUpdateKey = (update: any): string => {
  const regulation = update?.regulation || update?.name || '';
  const title = update?.title || '';
  const date = update?.update_date || update?.date || '';
  const description = update?.description || '';
  return `${regulation}|${title}|${date}|${description.slice(0, 100)}`;
};

/**
 * Compare step4 results and find new/changed updates
 */
export const compareStep4Results = (
  oldResults: Step4Results | undefined,
  newResults: Step4Results | undefined
): { newUpdates: number; changedUpdates: number; newUpdateKeys: Set<string> } => {
  if (!newResults?.compliance_updates) {
    return { newUpdates: 0, changedUpdates: 0, newUpdateKeys: new Set() };
  }

  const newUpdates: string[] = [];
  const changedUpdates: string[] = [];
  const newUpdateKeys = new Set<string>();

  // If no previous results, this is the first run - don't count as new
  if (!oldResults?.compliance_updates || oldResults.compliance_updates.length === 0) {
    return { newUpdates: 0, changedUpdates: 0, newUpdateKeys: new Set() };
  }

  // Build a map of old update keys to their full content
  const oldUpdateMap = new Map<string, any>();
  oldResults.compliance_updates.forEach((update: any) => {
    const key = getUpdateKey(update);
    oldUpdateMap.set(key, update);
  });

  // Compare new updates against old ones
  newResults.compliance_updates.forEach((newUpdate: any) => {
    const key = getUpdateKey(newUpdate);

    if (!oldUpdateMap.has(key)) {
      // This is a completely new update
      newUpdates.push(key);
      newUpdateKeys.add(key);
    } else {
      // Check if content changed significantly
      const oldUpdate = oldUpdateMap.get(key);
      const newDesc = newUpdate?.description || '';
      const oldDesc = oldUpdate?.description || '';
      const newImpact = newUpdate?.impact || '';
      const oldImpact = oldUpdate?.impact || '';

      if (newDesc !== oldDesc || newImpact !== oldImpact) {
        changedUpdates.push(key);
        newUpdateKeys.add(key);
      }
    }
  });

  return {
    newUpdates: newUpdates.length,
    changedUpdates: changedUpdates.length,
    newUpdateKeys
  };
};

/**
 * Get user info from Auth0 user object
 */
export const getUserInfo = (user: any) => ({
  user_id: user?.sub || 'unknown',
  email: user?.email || 'unknown@example.com',
  name: user?.name || user?.nickname || user?.email || 'Unknown User'
});

/**
 * Format log level colors for console output
 */
export const getLevelColor = (level: string): string => {
  const levelColors: Record<string, string> = {
    'DEBUG': '#9ca3af',
    'INFO': '#3b82f6',
    'WARNING': '#f59e0b',
    'ERROR': '#ef4444',
    'CRITICAL': '#dc2626'
  };
  return levelColors[level] || '#6b7280';
};

/**
 * Calculate days until/since a target date
 */
export const calculateDaysUntil = (targetDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `in ${diffDays}d`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)}d ago`;
  } else {
    return 'today';
  }
};

/**
 * Normalize element type to standard categories
 */
export const normalizeElementType = (rawType: string | undefined): 'Legislation' | 'Standard' | 'Marking' => {
  if (!rawType) return 'Marking';

  const typeLower = rawType.toLowerCase();
  if (typeLower.includes('legislation') || typeLower.includes('regulation')) {
    return 'Legislation';
  } else if (typeLower.includes('standard')) {
    return 'Standard';
  } else {
    return 'Marking';
  }
};
