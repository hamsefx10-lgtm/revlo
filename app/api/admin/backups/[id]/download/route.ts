import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    // Simulate backup download (in a real app, this would stream the actual backup file)
    console.log(`Downloading backup ${id} for company ${companyId}`);

    // Create a mock SQL backup file content
    const mockBackupContent = `-- Database Backup
-- Generated: ${new Date().toISOString()}
-- Company: ${companyId}
-- Backup ID: ${id}

-- Table: users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: companies
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: projects
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  agreement_amount DECIMAL(10,2),
  advance_paid DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  customer_id INTEGER REFERENCES customers(id),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: expenses
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  sub_category VARCHAR(100),
  project_id INTEGER REFERENCES projects(id),
  customer_id INTEGER REFERENCES customers(id),
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO companies (name) VALUES ('Sample Company');
INSERT INTO users (email, name) VALUES ('admin@company.com', 'Admin User');
INSERT INTO customers (name, email, phone, company_id) VALUES 
  ('John Doe', 'john@example.com', '123-456-7890', 1),
  ('Jane Smith', 'jane@example.com', '098-765-4321', 1);

-- End of backup
`;

    // Return the backup file as a download
    return new NextResponse(mockBackupContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="backup-${id}.sql"`,
        'Content-Length': mockBackupContent.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to download backup', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
