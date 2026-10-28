import React from 'react';
import { Server, Send, Radio, GitBranch } from 'lucide-react';
import type { StudioTab } from '../store/studioStore';

export interface StudioNavItem {
  id: StudioTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Unified studio navigation items across Desktop Header, Tablet Segmented Bar, and Mobile Bottom Nav.
 */
export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { id: 'connections', label: 'Brokers', icon: Server },
  { id: 'publisher', label: 'Publish', icon: Send },
  { id: 'subscriber', label: 'Subscribe', icon: Radio },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
];
