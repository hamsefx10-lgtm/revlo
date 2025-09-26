import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    console.log('Messages API - Session:', session);
    console.log('Messages API - User:', session?.user);
    console.log('Messages API - Company ID:', session?.user?.companyId);
    
    if (!session?.user?.id) {
      console.log('Messages API - No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.user?.companyId) {
      console.log('Messages API - No company ID in session');
      return NextResponse.json({ error: 'Company ID not found in session' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Check if user is member of the room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        companyId: session.user.companyId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 });
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 50
    });

    // Format response
    const formattedMessages = messages.map((message: any) => ({
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
      replyTo: message.replyToId ? {
        id: message.replyToId,
        content: 'Reply to message',
        senderName: 'Unknown'
      } : null,
      isEdited: false,
      isPinned: false,
      reactions: {}
    }));

    return NextResponse.json({ 
      success: true,
      messages: formattedMessages.reverse() 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    console.log('Messages POST API - Session:', session);
    console.log('Messages POST API - User:', session?.user);
    console.log('Messages POST API - Company ID:', session?.user?.companyId);
    
    if (!session?.user?.id) {
      console.log('Messages POST API - No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.user?.companyId) {
      console.log('Messages POST API - No company ID in session');
      return NextResponse.json({ error: 'Company ID not found in session' }, { status: 400 });
    }

    const { roomId, content, type, fileUrl, fileName, fileSize } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Check if user is member of the room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        companyId: session.user.companyId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        content: content.trim(),
        type: type || 'text',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize ? parseInt(fileSize.toString()) : null,
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
      where: { id: roomId },
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
      replyTo: message.replyToId ? {
        id: message.replyToId,
        content: 'Reply to message',
        senderName: 'Unknown'
      } : null,
      isEdited: false,
      isPinned: false,
      reactions: {}
    };

    return NextResponse.json({ 
      success: true,
      message: formattedMessage 
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    console.log('Messages DELETE API - Session:', session);
    console.log('Messages DELETE API - User:', session?.user);
    console.log('Messages DELETE API - Company ID:', session?.user?.companyId);
    
    if (!session?.user?.id) {
      console.log('Messages DELETE API - No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.user?.companyId) {
      console.log('Messages DELETE API - No company ID in session');
      return NextResponse.json({ error: 'Company ID not found in session' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if message exists and user is the sender
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id,
        chatRoom: {
          companyId: session.user.companyId
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 });
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
