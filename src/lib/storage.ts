import { supabase } from '@/services/supabase';

export const uploadFile = async (
  path: string,
  file: Blob,
  fileName: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('general')
      .upload(`${path}/${fileName}`, file, {
        upsert: false,
      });

    if (error) throw error;

    return data?.path || null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from('general').remove([path]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage.from('general').getPublicUrl(path);
  return data?.publicUrl || '';
};
