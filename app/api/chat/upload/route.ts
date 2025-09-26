import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { uploadRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/rate-limiter';
import { InputValidator } from '@/lib/input-validator';
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security-headers';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = await uploadRateLimiter.checkLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.resetTime, rateLimitResult.message!);
    }

    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return createSecureErrorResponse('Unauthorized', 401);
    }

    if (!session?.user?.companyId) {
      return createSecureErrorResponse('Company ID not found in session', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = formData.get('roomId') as string;

    if (!file) {
      return createSecureErrorResponse('No file provided', 400);
    }

    if (!roomId) {
      return createSecureErrorResponse('Room ID is required', 400);
    }

    // Validate room ID format
    const roomIdValidation = InputValidator.validateUUID(roomId);
    if (!roomIdValidation.isValid) {
      return createSecureErrorResponse('Invalid room ID format', 400);
    }

    // Check if user is member of the room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomIdValidation.sanitizedValue,
        companyId: session.user.companyId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!room) {
      return createSecureErrorResponse('Room not found or access denied', 404);
    }

    // Enhanced file validation
    const fileValidation = InputValidator.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
      ],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar']
    });

    if (!fileValidation.isValid) {
      return createSecureErrorResponse(fileValidation.errors.join(', '), 400);
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
    await mkdir(uploadDir, { recursive: true });

    // Generate secure filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const sanitizedFileName = InputValidator.sanitizeHTML(file.name);
    const fileName = `${timestamp}-${randomId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Determine message type based on file type
    const isImage = file.type.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomIdValidation.sanitizedValue!,
        content: isImage ? '📷 Image' : `📎 ${sanitizedFileName}`,
        type: messageType,
        fileUrl: `/uploads/chat/${fileName}`,
        fileName: sanitizedFileName,
        fileSize: file.size,
        senderId: session.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Update room's last activity
    await prisma.chatRoom.update({
      where: { id: roomIdValidation.sanitizedValue! },
      data: { updatedAt: new Date() }
    });

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.sender.id,
      senderName: message.sender.fullName,
      senderAvatar: null,
      timestamp: message.createdAt,
      type: message.type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      replyTo: null,
      isEdited: false,
      isPinned: false,
      reactions: {}
    };

    return createSecureResponse({ 
      success: true,
      message: formattedMessage 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
