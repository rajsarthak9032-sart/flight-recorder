/**
 * Authoritative Navigation Items and Active State Helpers
 */

export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Command Center', href: '/', icon: 'space_dashboard', exact: true },
  { name: 'Flight Recorder', href: '/flight-recorder', icon: 'show_chart' },
  { name: 'Experiments', href: '/experiments', icon: 'biotech' },
  { name: 'Replay Lab', href: '/replay', icon: 'compare' },
  { name: 'Diagnostics', href: '/diagnostics', icon: 'troubleshoot' },
  { name: 'Models', href: '/models', icon: 'deployed_code' },
  { name: 'Hardware', href: '/hardware', icon: 'memory' },
  { name: 'Reports', href: '/reports', icon: 'description' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

/**
 * Normalizes and checks if a navigation item is active given a pathname.
 * Guarantees no unintended fallback to '/replay' or false-positive active states.
 */
export function isNavigationItemActive(itemHref: string, currentPathname: string): boolean {
  if (!currentPathname) return false;
  
  // Exact match for root / Command Center
  if (itemHref === '/') {
    return currentPathname === '/' || currentPathname === '/command-center' || currentPathname === '/command_center';
  }

  // Flight Recorder (matches both /flight-recorder and legacy /live-flight-recorder or /live-runs)
  if (itemHref === '/flight-recorder') {
    return currentPathname === '/flight-recorder' || 
           currentPathname === '/live-flight-recorder' || 
           currentPathname === '/live-runs' || 
           currentPathname.startsWith('/flight-recorder/') ||
           currentPathname.startsWith('/live-flight-recorder/');
  }

  // Replay Lab
  if (itemHref === '/replay') {
    return currentPathname === '/replay' || 
           currentPathname === '/replay-lab' || 
           currentPathname.startsWith('/replay/') ||
           currentPathname.startsWith('/replay-lab/');
  }

  // Diagnostics (matches /diagnostics, /failure-diagnostics, and individual /runs/:id)
  if (itemHref === '/diagnostics') {
    return currentPathname === '/diagnostics' || 
           currentPathname === '/failure-diagnostics' || 
           currentPathname.startsWith('/diagnostics/') || 
           currentPathname.startsWith('/failure-diagnostics/') || 
           currentPathname.startsWith('/runs/');
  }

  // Experiments
  if (itemHref === '/experiments') {
    return currentPathname === '/experiments' || currentPathname.startsWith('/experiments/');
  }

  // Models / Model Lab
  if (itemHref === '/models') {
    return currentPathname === '/models' || 
           currentPathname === '/model-lab' || 
           currentPathname.startsWith('/models/') || 
           currentPathname.startsWith('/model-lab/');
  }

  // Hardware
  if (itemHref === '/hardware') {
    return currentPathname === '/hardware' || currentPathname.startsWith('/hardware/');
  }

  // Reports
  if (itemHref === '/reports') {
    return currentPathname === '/reports' || currentPathname.startsWith('/reports/');
  }

  // Settings
  if (itemHref === '/settings') {
    return currentPathname === '/settings' || currentPathname.startsWith('/settings/');
  }

  return currentPathname === itemHref;
}

export function renderSidebarNavHtml(currentPath: string): string {
  return NAVIGATION_ITEMS.map((item) => {
    const active = isNavigationItemActive(item.href, currentPath);
    const activeClass = active
      ? 'bg-surface-container text-primary font-medium'
      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface';
    const iconClass = active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface';
    const ariaCurrent = active ? ' aria-current="page"' : '';

    return `
      <a${ariaCurrent} class="flex items-center gap-space-sm px-space-sm py-1.5 rounded transition-colors group ${activeClass}" data-path="${item.href.replace('/', '') || 'command-center'}" href="${item.href}">
        <span class="material-symbols-outlined text-[18px] shrink-0 ${iconClass}">${item.icon}</span>
        <span class="font-body-md text-body-md tracking-tight">${item.name}</span>
      </a>
    `.trim();
  }).join('\n');
}
