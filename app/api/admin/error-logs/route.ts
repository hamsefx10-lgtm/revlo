import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate error logs (in a real app, these would come from a logging system)
    const logs = [
      {
        id: '1',
        level: 'error' as const,
        message: 'Database connection timeout after 30 seconds',
        stack: 'Error: Connection timeout\n    at Database.connect (/app/lib/db.js:45:12)\n    at async query (/app/lib/db.js:78:9)',
        source: 'Database',
        userId: 'user-123',
        userEmail: 'admin@company.com',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        resolved: false,
        metadata: { query: 'SELECT * FROM transactions', timeout: 30000 }
      },
      {
        id: '2',
        level: 'warning' as const,
        message: 'High memory usage detected: 85%',
        source: 'System Monitor',
        userId: 'system',
        userEmail: undefined,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        resolved: true,
        resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        resolvedBy: 'admin@company.com',
        metadata: { memoryUsage: 85, threshold: 80 }
      },
      {
        id: '3',
        level: 'error' as const,
        message: 'Failed to process payment transaction',
        stack: 'Error: Payment gateway timeout\n    at PaymentProcessor.process (/app/lib/payment.js:23:8)',
        source: 'Payment System',
        userId: 'user-456',
        userEmail: 'user@company.com',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        resolved: false,
        metadata: { transactionId: 'txn-789', amount: 1500, gateway: 'stripe' }
      },
      {
        id: '4',
        level: 'info' as const,
        message: 'User login successful',
        source: 'Authentication',
        userId: 'user-789',
        userEmail: 'user2@company.com',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        resolved: true,
        resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        resolvedBy: 'system',
        metadata: { ip: '192.168.1.100', userAgent: 'Mozilla/5.0...' }
      },
      {
        id: '5',
        level: 'debug' as const,
        message: 'Cache miss for key: user-preferences-123',
        source: 'Cache System',
        userId: 'system',
        userEmail: undefined,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        resolved: true,
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
        resolvedBy: 'system',
        metadata: { cacheKey: 'user-preferences-123', ttl: 3600 }
      },
      {
        id: '6',
        level: 'error' as const,
        message: 'File upload failed: File too large',
        source: 'File Upload',
        userId: 'user-321',
        userEmail: 'user3@company.com',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        resolved: false,
        metadata: { fileName: 'large-document.pdf', fileSize: 15728640, maxSize: 10485760 }
      },
      {
        id: '7',
        level: 'warning' as const,
        message: 'API rate limit approaching: 90% of limit used',
        source: 'API Gateway',
        userId: 'user-654',
        userEmail: 'user4@company.com',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        resolved: true,
        resolvedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        resolvedBy: 'admin@company.com',
        metadata: { requestsUsed: 900, limit: 1000, resetTime: '2024-01-15T00:00:00Z' }
      },
      {
        id: '8',
        level: 'error' as const,
        message: 'Email service unavailable',
        stack: 'Error: SMTP connection failed\n    at EmailService.send (/app/lib/email.js:67:15)',
        source: 'Email Service',
        userId: 'system',
        userEmail: undefined,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        resolved: false,
        metadata: { smtpHost: 'smtp.company.com', port: 587, error: 'ECONNREFUSED' }
      }
    ];

    return NextResponse.json({ 
      success: true, 
      logs,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch error logs', error: error.message },
      { status: 500 }
    );
  }
}
