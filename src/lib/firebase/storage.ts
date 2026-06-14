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

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `${userId}/${Date.now()}_${cleanFileName}`;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/attachments/${filePath}`;

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
  return `${supabaseUrl}/storage/v1/object/public/attachments/${filePath}`;
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

  let relativePath = filePath;
  const prefix = `${supabaseUrl}/storage/v1/object/public/attachments/`;
  if (filePath.startsWith(prefix)) {
    relativePath = filePath.replace(prefix, '');
  }

  const deleteUrl = `${supabaseUrl}/storage/v1/object/attachments/${relativePath}`;

  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
  });
}
