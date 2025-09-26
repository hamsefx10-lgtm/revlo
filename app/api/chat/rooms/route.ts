import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    console.log('Rooms API - Session:', session);
    console.log('Rooms API - User:', session?.user);
    console.log('Rooms API - Company ID:', session?.user?.companyId);
    
    if (!session?.user?.id) {
      console.log('Rooms API - No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.user?.companyId) {
      console.log('Rooms API - No company ID in session');
      return NextResponse.json({ error: 'Company ID not found in session' }, { status: 400 });
    }

    // Get or create company's general chat room
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        companyId: session.user.companyId,
        type: 'group'
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // If no room exists, create one with all company users
    if (!chatRoom) {
      // Get all users from the same company
      const companyUsers = await prisma.user.findMany({
        where: {
          companyId: session.user.companyId
        },
        select: {
          id: true,
          fullName: true,
          email: true
        }
      });

      if (companyUsers.length === 0) {
        return NextResponse.json({ error: 'No users found in company' }, { status: 404 });
      }

      // Create company chat room with all users
      chatRoom = await prisma.chatRoom.create({
        data: {
          name: 'Company Chat',
          type: 'group',
          companyId: session.user.companyId,
          members: {
            create: companyUsers.map((user: any, index: number) => ({
              userId: user.id,
              role: index === 0 ? 'admin' : 'member' // First user is admin
            }))
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      });
    }

    // Format response
    const formattedRoom = {
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      companyId: chatRoom.companyId,
      members: chatRoom.members.map((member: any) => ({
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email
      })),
      unreadCount: 0,
      isOnline: true,
      avatar: chatRoom.avatar
    };

    return NextResponse.json({ 
      success: true,
      rooms: [formattedRoom] 
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Company ID not found in session' }, { status: 400 });
    }

    // Get all users from the same company
    const companyUsers = await prisma.user.findMany({
      where: {
        companyId: session.user.companyId
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    if (companyUsers.length === 0) {
      return NextResponse.json({ error: 'No users found in company' }, { status: 404 });
    }

    // Create company chat room with all users
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: 'Company Chat',
        type: 'group',
        companyId: session.user.companyId,
        members: {
          create: companyUsers.map((user: any, index: number) => ({
            userId: user.id,
            role: index === 0 ? 'admin' : 'member' // First user is admin
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Format response
    const formattedRoom = {
      id: chatRoom.id,
      name: chatRoom.name,
      type: chatRoom.type,
      companyId: chatRoom.companyId,
      members: chatRoom.members.map((member: any) => ({
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email
      })),
      unreadCount: 0,
      isOnline: true,
      avatar: chatRoom.avatar
    };

    return NextResponse.json({ 
      success: true,
      room: formattedRoom 
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
