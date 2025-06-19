
import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

// Create temporary directory for file operations
const TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Create a fallback directory for local storage when object storage is unavailable
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

// Initialize Replit Object Storage client
const storageClient = new Client();

/**
 * Upload a file to the Replit Object Storage
 * @param localFilePath Path to the local file
 * @param key The key (name) to use in the bucket
 * @returns The URL to access the file
 */
export async function uploadToBluechpBucket(localFilePath: string, key: string): Promise<string> {
  console.log(`Uploading ${localFilePath} to Replit Object Storage as ${key}`);

  try {
    // Upload from file using the correct method
    const result = await storageClient.uploadFromFilename(key, localFilePath);
    
    if (!result.ok) {
      throw new Error(`Upload failed: ${result.error.message}`);
    }
    
    console.log('Successfully uploaded to Replit Object Storage');

    // Generate URL for accessing the file
    const url = `/api/documents/download/${encodeURIComponent(key)}`;

    console.log('Successfully uploaded to Replit Object Storage:', url);
    return url;
  } catch (error) {
    console.error('Error uploading to Replit Object Storage:', error);

    // Fallback to local storage
    const fileName = path.basename(key);
    const localPath = path.join(LOCAL_STORAGE_DIR, fileName);

    // Copy file to local storage
    fs.copyFileSync(localFilePath, localPath);

    console.log('Fallback: Saved to local storage:', localPath);
    return `/uploads/documents/${fileName}`;
  }
}

/**
 * Download a file from the Replit Object Storage
 * @param key The key of the file in the bucket
 * @param downloadPath The local path to save the file
 * @returns Success status
 */
export async function downloadFromBluechpBucket(key: string, downloadPath: string): Promise<boolean> {
  console.log(`Downloading ${key} from Replit Object Storage to ${downloadPath}`);

  try {
    // Download to file using the correct method
    const result = await storageClient.downloadToFilename(key, downloadPath);
    
    if (!result.ok) {
      throw new Error(`Download failed: ${result.error.message}`);
    }
    
    console.log('Successfully downloaded from Replit Object Storage');
    return true;
  } catch (error) {
    console.error('Error downloading from Replit Object Storage:', error);

    // Try using the local fallback
    try {
      const fileName = path.basename(key);
      const localPath = path.join(LOCAL_STORAGE_DIR, fileName);

      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, downloadPath);
        console.log('Fallback: Retrieved from local storage:', localPath);
        return true;
      }
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
    }

    return false;
  }
}

/**
 * Delete a file from the Replit Object Storage
 * @param key The key of the file in the bucket
 * @returns Success status
 */
export async function deleteFromBluechpBucket(key: string): Promise<boolean> {
  console.log(`Deleting ${key} from Replit Object Storage`);

  try {
    // Delete the object using the correct method
    const result = await storageClient.delete(key);
    
    if (!result.ok) {
      throw new Error(`Delete failed: ${result.error.message}`);
    }
    
    console.log('Successfully deleted from Replit Object Storage');

    // Also delete from local fallback if it exists
    try {
      const fileName = path.basename(key);
      const localPath = path.join(LOCAL_STORAGE_DIR, fileName);

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (localError) {
      console.error('Error deleting from local fallback:', localError);
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Replit Object Storage:', error);

    // Try deleting from local fallback
    try {
      const fileName = path.basename(key);
      const localPath = path.join(LOCAL_STORAGE_DIR, fileName);

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log('Fallback: Deleted from local storage:', localPath);
        return true;
      }
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
    }

    return false;
  }
}

/**
 * Get the appropriate content type for a file
 * @param filePath Path to the file
 * @returns Content type string
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',
    '.zip': 'application/zip',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
