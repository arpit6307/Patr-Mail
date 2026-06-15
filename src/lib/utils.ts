import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';
import { format, formatDistanceToNow, isToday, isYesterday, isThisYear } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// ─── Tailwind className merge ───────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ────────────────────────────────────

function toDate(d: Timestamp | Date | undefined | null): Date {
  if (!d) return new Date();
  if (d instanceof Timestamp) return d.toDate();
  return d;
}

export function formatEmailDate(date: Timestamp | Date | undefined | null): string {
  const d = toDate(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisYear(d)) return format(d, 'MMM d');
  return format(d, 'MMM d, yyyy');
}

export function formatFullDate(date: Timestamp | Date | undefined | null): string {
  const d = toDate(date);
  return format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

// ─── File size formatting ───────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

// ─── Avatar helpers ─────────────────────────────────────

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#FF6B35', '#1A73E8', '#138808', '#E91E63', '#9C27B0',
  '#00BCD4', '#FF9800', '#795548', '#607D8B', '#3F51B5',
  '#009688', '#F44336', '#4CAF50', '#FF5722', '#673AB7',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── HTML Sanitization ──────────────────────────────────

export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Clean up inline styles that force text colors or backgrounds to ensure high contrast/readability
  let cleanedHtml = html
    .replace(/(style\s*=\s*["'][^"']*)color\s*:\s*[^;]+;?/gi, '$1')
    .replace(/(style\s*=\s*["'][^"']*)background-color\s*:\s*[^;]+;?/gi, '$1')
    .replace(/style\s*=\s*["']\s*["']/gi, '');

  if (typeof window === 'undefined') return cleanedHtml;
  return DOMPurify.sanitize(cleanedHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'div', 'span',
      'hr', 'sub', 'sup',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'width', 'height'],
  });
}

// ─── Truncate text ──────────────────────────────────────

export function truncate(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '…';
}

// ─── File icon helper ───────────────────────────────────

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'file-spreadsheet';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'file-archive';
  return 'file';
}
