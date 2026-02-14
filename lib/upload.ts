// lib/upload.ts - File upload utility for receipt images
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'receipts');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Save an uploaded image file to the public directory
 * @param file - The uploaded file (File or Blob)
 * @returns The public URL path to access the image
 */
export async function saveReceiptImage(file: File): Promise<string> {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit.');
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name) || '.jpg';
    const filename = `receipt-${timestamp}-${randomStr}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL path
    return `/uploads/receipts/${filename}`;
}

/**
 * Extract file from FormData
 * @param formData - The FormData object
 * @param fieldName - The field name containing the file
 * @returns The extracted file or null
 */
export function extractFileFromFormData(formData: FormData, fieldName: string): File | null {
    const file = formData.get(fieldName);
    if (file instanceof File) {
        return file;
    }
    return null;
}
