## Revlo App

Project & Financial Management for multi-company environments built on Next.js 14, Prisma, and PostgreSQL.

### Stack
- Next.js 14 (App Router), React 18, TypeScript
- Prisma ORM + PostgreSQL
- NextAuth (Credentials, JWT sessions)
- TailwindCSS

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Environment variables
Create a `.env` file at the project root:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change_me_generate_strong_secret"
```

### Install & Database
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

If deploying to production, use:
```bash
npx prisma migrate deploy
```

### Development
```bash
npm run dev
```

### Build & Start
```bash
npm run build
npm start
```

### Notes
- Multi-tenancy: all data is scoped by `companyId`. Server routes use session (`getSessionCompanyUser`) to enforce it.
- Authentication: credentials provider with bcrypt hashing; sign-in page at `/login`.
- Prisma client: single instance exported from `lib/db.ts`.

### Import Excel Data
To import your existing data from Excel:

1. **Prepare your Excel file** with these sheets:
   - `Companies` - company information
   - `Users` - user accounts
   - `Projects` - project details
   - `Expenses` - expense records

2. **Place your Excel file** in the `data/` folder as `revlo-data.xlsx`

3. **Run the import script**:
   ```bash
   npm run import-excel
   ```

**Excel Format Example**:
- **Companies**: name, industry, email, phone, address, website, taxId
- **Users**: fullName, email, password, phone, role, status, companyId
- **Projects**: name, description, startDate, endDate, status, budget, companyId
- **Expenses**: amount, description, date, category, status, userId, projectId, companyId
