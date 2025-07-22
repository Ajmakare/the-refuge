import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPlaytime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h`;
}

export function formatNumber(num: number): string {
  if (num == null || num === undefined || isNaN(num)) {
    return '0';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Rank formatting and color utilities
export function formatRank(rankValue: string | undefined): string {
  if (!rankValue) return '[Member]';
  
  // Clean the rank value - remove brackets if present and convert to lowercase
  let cleanRank = rankValue.toLowerCase().replace(/[\[\]]/g, '');
  
  // Handle special cases
  if (cleanRank === 'default') {
    cleanRank = 'member';
  }
  
  const rankMap: Record<string, string> = {
    'admin': '[Admin]',
    'moderator': '[Moderator]',
    'helper': '[Helper]',
    'trusted': '[Trusted]',
    'donatorplus': '[Donator+]',
    'donator': '[Donator]',
    'friend': '[Friend]',
    'member': '[Member]'
  };
  
  return rankMap[cleanRank] || '[Member]';
}

export function getRankColor(rankValue: string | undefined): string {
  if (!rankValue) return '#55FFFF'; // Default aqua for member
  
  // Clean the rank value - remove brackets if present and convert to lowercase
  let cleanRank = rankValue.toLowerCase().replace(/[\[\]]/g, '');
  
  // Handle special cases
  if (cleanRank === 'default') {
    cleanRank = 'member';
  }
  
  const colorMap: Record<string, string> = {
    'admin': '#FF5555',        // &c - red
    'moderator': '#FFAA00',    // &6 - gold
    'helper': '#5555FF',       // &9 - blue
    'trusted': '#FF55FF',      // &5 - dark purple
    'donatorplus': '#55FF55',  // &a - green
    'donator': '#55FF55',      // &a - green
    'friend': '#FFFF55',       // &e - yellow
    'member': '#55FFFF'        // &b - aqua
  };
  
  return colorMap[cleanRank] || '#55FFFF';
}