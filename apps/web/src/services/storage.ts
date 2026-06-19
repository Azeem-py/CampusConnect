import { supabase } from '../lib/supabaseClient';

/**
 * Uploads a file to the 'prod' bucket inside a specific folder
 * @returns The public CDN URL of the uploaded asset
 */
export async function uploadPublicFile(
  folder: 'avatars' | 'banners' | 'posts' | 'notes',
  file: File,
  customPath?: string
): Promise<string> {
  // 1. File validation checks
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
  if (file.size > maxSizeBytes) {
    throw new Error('File size exceeds the maximum 5MB limit.');
  }

  // GIFs are allowed (MIME: image/gif). Videos are rejected (MIME starting with video/).
  if (!file.type.startsWith('image/') || file.type.startsWith('video/')) {
    throw new Error('Invalid file type. Only image files (including GIFs) are allowed. Videos are not permitted.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  
  // Prepend the folder name to the file path (e.g., 'avatars/randomname.png')
  const filePath = customPath 
    ? `${folder}/${customPath}/${fileName}` 
    : `${folder}/${fileName}`;

  // 1. Upload to Supabase Storage inside 'prod' bucket
  const { error } = await supabase.storage
    .from('prod')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload asset to "prod/${folder}": ${error.message}`);
  }

  // 2. Extract public CDN URL from 'prod' bucket
  const { data } = supabase.storage.from('prod').getPublicUrl(filePath);

  return data.publicUrl;
}
