
import { Client } from '@replit/object-storage';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import fs from 'fs';

// Create a temporary upload directory if it doesn't exist
const TEMP_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

// Create client for Replit Object Storage
const storageClient = new Client();

// Function to upload file to Replit Object Storage
export async function uploadToBluechpBucket(localFilePath: string, key: string): Promise<string> {
  try {
    console.log(`Uploading file ${localFilePath} to Replit Object Storage as ${key}`);

    // Upload directly from filename using the correct method
    const result = await storageClient.uploadFromFilename(key, localFilePath);
    
    if (!result.ok) {
      throw new Error(`Upload failed: ${result.error.message}`);
    }
    
    console.log('Successfully uploaded to Replit Object Storage');

    // Return a URL for the file - this will be accessible via our API
    const url = `/api/documents/download/${encodeURIComponent(key)}`;

    return url;
  } catch (error) {
    console.error('Error uploading to Replit Object Storage:', error);

    // Fallback to local storage if Object Storage upload fails
    const fallbackDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }

    const destPath = path.join(fallbackDir, path.basename(key));
    fs.copyFileSync(localFilePath, destPath);

    console.log(`Fallback: File saved locally at ${destPath}`);
    return `/uploads/documents/${path.basename(key)}`;
  }
}

// Function to download file from Replit Object Storage
export async function downloadFromBluechpBucket(key: string, localFilePath: string): Promise<boolean> {
  try {
    console.log(`Downloading file ${key} from Replit Object Storage to ${localFilePath}`);

    // Download to file using the correct method
    const result = await storageClient.downloadToFilename(key, localFilePath);
    
    if (!result.ok) {
      throw new Error(`Download failed: ${result.error.message}`);
    }
    
    console.log('Successfully downloaded from Replit Object Storage');
    return true;
  } catch (error) {
    console.error('Error downloading from Replit Object Storage:', error);

    // Fallback to local storage if Object Storage download fails
    try {
      const fallbackPath = path.join(process.cwd(), 'uploads', 'documents', path.basename(key));
      if (fs.existsSync(fallbackPath)) {
        fs.copyFileSync(fallbackPath, localFilePath);
        console.log(`Fallback: File retrieved from local storage at ${fallbackPath}`);
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }

    return false;
  }
}

// Function to delete file from Replit Object Storage
export async function deleteFromBluechpBucket(key: string): Promise<boolean> {
  try {
    console.log(`Deleting file ${key} from Replit Object Storage`);

    // Delete from Replit Object Storage using the correct method
    const result = await storageClient.delete(key);
    
    if (!result.ok) {
      throw new Error(`Delete failed: ${result.error.message}`);
    }
    
    console.log('Successfully deleted from Replit Object Storage');

    return true;
  } catch (error) {
    console.error('Error deleting from Replit Object Storage:', error);

    // Fallback to local storage if Object Storage delete fails
    try {
      const fallbackPath = path.join(process.cwd(), 'uploads', 'documents', path.basename(key));
      if (fs.existsSync(fallbackPath)) {
        fs.unlinkSync(fallbackPath);
        console.log(`Fallback: File deleted from local storage at ${fallbackPath}`);
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
    }

    return false;
  }
}

// Helper function to determine content type from file extension
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
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.zip': 'application/zip',
    '.xml': 'application/xml',
    '.json': 'application/json',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
