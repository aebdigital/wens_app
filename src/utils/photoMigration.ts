import { supabase } from '../lib/supabase';

export interface PhotoData {
  id: string;
  file: File;
  url: string;
  description: string;
  storagePath?: string;
}

interface PersistentPhoto {
  id: string;
  name: string;
  type: string;
  base64: string;
  url: string;
  storagePath: string;
  description: string;
}

/**
 * Converts a base64 string to a File object
 */
const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  // Extract the base64 data portion (remove data:mime/type;base64, prefix if present)
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Decode base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  // Create blob and file
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType, lastModified: Date.now() });
};

/**
 * Uploads a file to Supabase Storage
 * @returns The storage path and public URL, or null if upload fails
 */
export const uploadToSupabaseStorage = async (
  file: File,
  userId: string,
  spisEntryId: string
): Promise<{ url: string; storagePath: string } | null> => {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storagePath = `${userId}/${spisEntryId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath);

    return {
      url: urlData.publicUrl,
      storagePath
    };
  } catch (error) {
    console.error('Failed to upload to Supabase:', error);
    return null;
  }
};

/**
 * Migrates a single base64 photo to Supabase Storage
 */
export const migrateBase64Photo = async (
  photo: PersistentPhoto,
  userId: string,
  spisEntryId: string
): Promise<PersistentPhoto> => {
  // Skip if already migrated
  if (photo.storagePath) {
    return photo;
  }

  // Skip if no base64 data
  if (!photo.base64) {
    return photo;
  }

  try {
    // Convert base64 to File
    const file = base64ToFile(photo.base64, photo.name, photo.type);

    // Upload to Supabase Storage
    const result = await uploadToSupabaseStorage(file, userId, spisEntryId);

    if (result) {
      // Successfully migrated
      return {
        ...photo,
        base64: '', // Clear base64 data
        url: result.url,
        storagePath: result.storagePath
      };
    }
  } catch (error) {
    console.error('Failed to migrate photo:', photo.name, error);
  }

  // Return unchanged if migration failed
  return photo;
};

/**
 * Migrates all base64 photos in a spis entry to Supabase Storage
 * Returns the updated photos array and a flag indicating if any were migrated
 */
export const migrateAllBase64Photos = async (
  photos: PersistentPhoto[],
  userId: string,
  spisEntryId: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ photos: PersistentPhoto[]; migratedCount: number }> => {
  // Find photos that need migration (have base64 but no storagePath)
  const photosToMigrate = photos.filter(p => p.base64 && !p.storagePath);

  if (photosToMigrate.length === 0) {
    return { photos, migratedCount: 0 };
  }

  console.log(`Migrating ${photosToMigrate.length} photos to Supabase Storage...`);

  let migratedCount = 0;
  const updatedPhotos = await Promise.all(
    photos.map(async (photo, index) => {
      const needsMigration = photo.base64 && !photo.storagePath;

      if (needsMigration) {
        const migrated = await migrateBase64Photo(photo, userId, spisEntryId);
        if (migrated.storagePath) {
          migratedCount++;
        }
        onProgress?.(index + 1, photos.length);
        return migrated;
      }

      onProgress?.(index + 1, photos.length);
      return photo;
    })
  );

  console.log(`Migration complete: ${migratedCount} photos migrated`);
  return { photos: updatedPhotos, migratedCount };
};

/**
 * Checks if any photos in the array need migration
 */
export const hasBase64Photos = (photos: PersistentPhoto[]): boolean => {
  return photos.some(p => p.base64 && !p.storagePath);
};

/**
 * Estimates the size of base64 photos that need migration
 */
export const estimateMigrationSize = (photos: PersistentPhoto[]): number => {
  return photos
    .filter(p => p.base64 && !p.storagePath)
    .reduce((total, p) => {
      // Base64 is roughly 4/3 times larger than binary
      const base64Size = p.base64.length;
      const estimatedBinarySize = Math.floor(base64Size * 0.75);
      return total + estimatedBinarySize;
    }, 0);
};

/**
 * Formats bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
