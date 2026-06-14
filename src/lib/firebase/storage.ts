/**
 * Helper to get clean Supabase Base URL (strips /rest/v1 suffix if present)
 */
function getCleanSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let baseUrl = supabaseUrl;
  if (baseUrl.includes('/rest/v1')) {
    baseUrl = baseUrl.split('/rest/v1')[0];
  }
  // Trim trailing slashes
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Upload a file attachment to Supabase Storage
 */
export async function uploadAttachment(userId: string, file: File): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing! Falling back to Object URL for local testing.");
    return URL.createObjectURL(file);
  }

  const baseUrl = getCleanSupabaseUrl();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `${userId}/${Date.now()}_${cleanFileName}`;

  const uploadUrl = `${baseUrl}/storage/v1/object/attachments/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase storage upload error:", errorText);
    throw new Error(`Failed to upload attachment: ${response.statusText}`);
  }

  // Return public download URL
  return `${baseUrl}/storage/v1/object/public/attachments/${filePath}`;
}

/**
 * Upload a user profile picture (avatar) to Supabase Storage
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing! Falling back to Object URL for local testing.");
    return URL.createObjectURL(file);
  }

  const baseUrl = getCleanSupabaseUrl();
  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}_${Date.now()}.${extension}`;

  const uploadUrl = `${baseUrl}/storage/v1/object/avatars/${filePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase avatar upload error:", errorText);
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }

  // Return public download URL
  return `${baseUrl}/storage/v1/object/public/avatars/${filePath}`;
}

/**
 * Delete a file attachment from Supabase Storage
 */
export async function deleteAttachment(filePath: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }

  const baseUrl = getCleanSupabaseUrl();
  let relativePath = filePath;
  const prefix = `${baseUrl}/storage/v1/object/public/attachments/`;
  if (filePath.startsWith(prefix)) {
    relativePath = filePath.replace(prefix, '');
  }

  const deleteUrl = `${baseUrl}/storage/v1/object/attachments/${relativePath}`;

  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
  });
}
