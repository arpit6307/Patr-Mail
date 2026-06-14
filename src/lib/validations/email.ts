const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Archive
  'application/zip',
  'application/x-zip-compressed',
  // Video
  'video/mp4',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv',
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'zip', 'mp4',
]);

export function isAllowedFileType(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_EXTENSIONS.has(ext);
}

export function validatePatrEmail(email: string): boolean {
  return /^[a-zA-Z0-9._-]+@patr\.in$/.test(email.trim());
}

export const MAX_ATTACHMENT_SIZE_MB = 25;
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
